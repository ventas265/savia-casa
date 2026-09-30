/**
 * A device can wipe its own rows and cannot wipe anyone else's.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { before, describe, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { rateKey, type SqlTag } from "./security-core.ts";
import { registerTesterCore } from "./testers-core.ts";
import { DEVICE_RATE_SCOPES, deleteDeviceDataCore } from "./delete-device-core.ts";

const MIGRATIONS = join(import.meta.dirname, "../../migrations");

async function freshDb() {
  const pg = new PGlite();
  await pg.waitReady;
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) await pg.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await pg.query(text, values)).rows;
  }) as unknown as SqlTag;
  return { sql };
}

const A = "device-aaaaaaaa-1111";
const B = "device-bbbbbbbb-2222";

describe("delete my data", () => {
  let sql: SqlTag;
  let tokenA = "";
  let tokenB = "";

  before(async () => {
    ({ sql } = await freshDb());
    const a = await registerTesterCore(sql, { deviceId: A, displayName: "Ana", stage: "cycle", country: "VE" }, "1.1.1.1");
    const b = await registerTesterCore(sql, { deviceId: B, displayName: "Bea", stage: "peri", country: "CO" }, "2.2.2.2");
    assert.equal(a.ok && b.ok, true);
    tokenA = a.ok ? a.token : "";
    tokenB = b.ok ? b.token : "";

    await sql`
      insert into savia_profiles (user_id, display_name, birth_year, last_period_start)
      values (${A}, ${"Ana"}, ${2004}, ${"2026-09-01"}), (${B}, ${"Bea"}, ${1990}, ${"2026-08-01"})
    `;
    await sql`
      insert into daily_logs (user_id, day, flow, notes, symptoms, sex, sex_kind)
      values
        (${A}, ${"2026-09-01"}, ${"medium"}, ${"nota a"}, ${'["cramps"]'}::jsonb, ${true}, ${"unprotected"}),
        (${B}, ${"2026-09-02"}, ${"light"}, ${"nota b"}, ${"[]"}::jsonb, ${false}, ${"none"})
    `;
    await sql`
      insert into period_starts (user_id, start_date)
      values (${A}, ${"2026-09-01"}), (${B}, ${"2026-08-01"})
    `;
    await sql`
      insert into push_subscriptions (endpoint, p256dh, auth, user_id, display_name)
      values
        (${"https://push.example/a"}, ${"k".repeat(30)}, ${"authauth"}, ${A}, ${"Ana"}),
        (${"https://push.example/b"}, ${"k".repeat(30)}, ${"authauth"}, ${B}, ${"Bea"})
    `;
    await sql`
      insert into profiles (user_id, display_name) values (${A}, ${"Ana"}), (${B}, ${"Bea"})
    `;
    await sql`insert into services (user_id, name) values (${A}, ${"x"}), (${B}, ${"y"})`;
    await sql`
      insert into quotes (user_id, public_id) values (${A}, ${"qa"}), (${B}, ${"qb"})
    `;
    await sql`
      insert into waitlist (user_id, email) values (${A}, ${"ana@example.com"}), (${null}, ${"lista@example.com"})
    `;
    await sql`
      insert into savia_settings (key, value) values (${"pay"}, ${'{"zinli":"savia"}'})
    `;
    await sql`
      insert into savia_payments (email, plan, amount, note)
      values (${"ana@example.com"}, ${"serena"}, ${4.99}, ${"pending: zinli"})
    `;
    await sql`insert into savia_waitlist (email, plan) values (${"ana@example.com"}, ${"serena"})`;

    const keyA = rateKey(A);
    const ipBucket = `ai-note-iph:${rateKey("9.9.9.9")}`;
    await sql`
      insert into savia_rate_limits (bucket, window_start, hits) values
        (${`ai-chat-d10m:${keyA}`}, ${"2026-09-30T12:00:00Z"}, ${2}),
        (${`ai-chat-dday:${keyA}`}, ${"2026-09-30T00:00:00Z"}, ${4}),
        (${`ai-note-dh:${keyA}`}, ${"2026-09-30T12:00:00Z"}, ${1}),
        (${ipBucket}, ${"2026-09-30T12:00:00Z"}, ${3}),
        (${"recover-all:global"}, ${"2026-09-30T12:00:00Z"}, ${7}),
        (${`ai-chat-dday:${rateKey(B)}`}, ${"2026-09-30T00:00:00Z"}, ${1})
    `;
  });

  test("wrong token and missing token delete nothing", async () => {
    const wrong = await deleteDeviceDataCore(sql, A, "x".repeat(64));
    assert.deepEqual(wrong, { ok: false, error: "auth" });
    const missing = await deleteDeviceDataCore(sql, A, "");
    assert.deepEqual(missing, { ok: false, error: "auth" });
    const otherToken = await deleteDeviceDataCore(sql, A, tokenB);
    assert.deepEqual(otherToken, { ok: false, error: "auth" });
    const logs = await sql<{ n: number }>`select count(*)::int as n from daily_logs where user_id = ${A}`;
    assert.equal(Number(logs[0]!.n), 1);
  });

  test("owner wipe removes her rows and leaves everyone else", async () => {
    const res = await deleteDeviceDataCore(sql, A, tokenA);
    assert.equal(res.ok, true);
    if (!res.ok) return;
    assert.equal(res.removed.logs, 1);
    assert.equal(res.removed.starts, 1);
    assert.equal(res.removed.push, 1);
    assert.equal(res.removed.profile, 1);
    assert.equal(res.removed.tester, 1);
    assert.equal(res.removed.rateLimits, 3);
    assert.ok(res.removed.legacy >= 4);

    const left = async (q: Promise<{ n: number }[]>) => Number((await q)[0]!.n);
    assert.equal(await left(sql`select count(*)::int as n from daily_logs where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from period_starts where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from push_subscriptions where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from savia_profiles where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from savia_testers where device_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from profiles where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from services where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from quotes where user_id = ${A}`), 0);
    assert.equal(await left(sql`select count(*)::int as n from waitlist where user_id = ${A}`), 0);

    assert.equal(await left(sql`select count(*)::int as n from daily_logs where user_id = ${B}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from savia_profiles where user_id = ${B}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from savia_testers where device_id = ${B}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from push_subscriptions where user_id = ${B}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from profiles where user_id = ${B}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from quotes where public_id = ${"qb"}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from waitlist where email = ${"lista@example.com"}`), 1);
    assert.equal(await left(sql`select count(*)::int as n from savia_settings`), 1);
    assert.equal(await left(sql`select count(*)::int as n from savia_payments`), 1);
    assert.equal(await left(sql`select count(*)::int as n from savia_waitlist`), 1);

    const buckets = await sql<{ bucket: string }>`select bucket from savia_rate_limits order by bucket`;
    const names = buckets.map((r) => r.bucket);
    assert.ok(names.some((b) => b.startsWith("ai-note-iph:")));
    assert.ok(names.includes("recover-all:global"));
    assert.ok(names.some((b) => b === `ai-chat-dday:${rateKey(B)}`));
    assert.equal(names.some((b) => b.endsWith(rateKey(A))), false);
  });

  test("repeat call and empty tables are safe", async () => {
    const again = await deleteDeviceDataCore(sql, A, tokenA);
    assert.deepEqual(again, { ok: false, error: "auth" });
    const stillB = await sql<{ n: number }>`select count(*)::int as n from daily_logs where user_id = ${B}`;
    assert.equal(Number(stillB[0]!.n), 1);

    const c = await registerTesterCore(sql, { deviceId: "device-empty-cccc", displayName: "", stage: "cycle" }, "3.3.3.3");
    assert.equal(c.ok, true);
    const wiped = await deleteDeviceDataCore(sql, "device-empty-cccc", c.ok ? c.token : "");
    assert.equal(wiped.ok, true);
    if (wiped.ok) {
      assert.equal(wiped.removed.logs, 0);
      assert.equal(wiped.removed.profile, 0);
      assert.equal(wiped.removed.tester, 1);
    }
  });

  test("device rate scopes match the per-device limits in the server", () => {
    const src = readFileSync(join(import.meta.dirname, "savia-server.ts"), "utf8");
    for (const scope of DEVICE_RATE_SCOPES) {
      assert.match(src, new RegExp(`rateLimit\\([^\\n]*"${scope}"`));
    }
    assert.ok(!DEVICE_RATE_SCOPES.includes("ai-chat-ip10m" as never));
    assert.ok(!DEVICE_RATE_SCOPES.includes("ai-note-iph" as never));
    assert.ok(!DEVICE_RATE_SCOPES.includes("recover-all" as never));
  });
});
