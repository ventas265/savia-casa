/**
 * Security phase 1 tests (audit items 2–5, plus caps for 1/3/7). DB logic runs
 * against an in-memory PGLite with the real migrations applied.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { before, describe, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  adminPinOk,
  CODE_ALPHABET,
  CODE_LENGTH,
  hashRecovery,
  isAdminIdentity,
  newRecoveryCode,
  normalizeCode,
  rateLimit,
  sha256Hex,
  verifyRecovery,
  type SqlTag,
} from "./security-core.ts";
import { assertDeviceCore, listTestersCore, recoverDeviceCore, registerTesterCore } from "./testers-core.ts";
import { isCompSerenaEmail } from "./serena-comps.ts";
import { askOpenSchema, noteOpenSchema, paymentReportSchema, waitlistSchema } from "./input-schemas.ts";

const MIGRATIONS = join(import.meta.dirname, "../../migrations");

async function freshDb(opts: { seedLegacy?: (pg: PGlite) => Promise<void> } = {}) {
  const pg = new PGlite();
  await pg.waitReady;
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (f.startsWith("0013") && opts.seedLegacy) await opts.seedLegacy(pg);
    await pg.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
  }
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let text = strings[0]!;
    for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
    return (await pg.query(text, values)).rows;
  }) as unknown as SqlTag;
  return { pg, sql };
}

const DEV = "device-aaaaaaaa-1111";

describe("item 4: registerTester", () => {
  let sql: SqlTag;
  before(async () => {
    ({ sql } = await freshDb());
  });

  test("new device gets a token and a >=12-char recovery code", async () => {
    const r = await registerTesterCore(sql, { deviceId: DEV, displayName: "Clau", stage: "cycle" }, "1.1.1.1");
    assert.equal(r.ok, true);
    assert.ok(r.ok && r.token.length >= 32);
    assert.ok(r.ok && normalizeCode(r.recovery).length >= 12);
  });

  test("never returns the existing token to a caller without it, never overwrites the name", async () => {
    const r = await registerTesterCore(sql, { deviceId: DEV, displayName: "Attacker", stage: "cycle" }, "2.2.2.2");
    assert.equal(r.ok, false);
    assert.equal(r.token, "");
    assert.equal(r.recovery, "");
    const rows = await sql<{ display_name: string }>`select display_name from savia_testers where device_id = ${DEV}`;
    assert.equal(rows[0]!.display_name, "Clau");
  });

  test("wrong token is rejected and does not leak the token", async () => {
    const r = await registerTesterCore(
      sql,
      { deviceId: DEV, displayName: "Attacker", stage: "cycle", token: "x".repeat(64) },
      "2.2.2.2",
    );
    assert.equal(r.ok, false);
    assert.equal(r.token, "");
  });

  test("owner with valid token refreshes without getting token/code again and keeps the name", async () => {
    const rows = await sql<{ token: string }>`select token from savia_testers where device_id = ${DEV}`;
    const r = await registerTesterCore(
      sql,
      { deviceId: DEV, displayName: "Otro nombre", stage: "peri", token: rows[0]!.token },
      "1.1.1.1",
    );
    assert.deepEqual(r, { ok: true, token: "", recovery: "" });
    const after = await sql<{ display_name: string; stage: string }>`select display_name, stage from savia_testers where device_id = ${DEV}`;
    assert.equal(after[0]!.display_name, "Clau");
    assert.equal(after[0]!.stage, "peri");
  });

  test("new-device registration is rate limited per IP", async () => {
    let last: Awaited<ReturnType<typeof registerTesterCore>> | undefined;
    for (let i = 0; i < 21; i++) {
      last = await registerTesterCore(sql, { deviceId: `spam-device-${i}-xx`, displayName: "x", stage: "cycle" }, "9.9.9.9");
    }
    assert.equal(last!.ok, false);
    assert.equal(!last!.ok && last!.error, "rate");
  });
});

describe("item 4: assertDevice without trust-on-first-use", () => {
  test("row with NULL token is not claimable by any token", async () => {
    const { sql } = await freshDb();
    await sql`insert into savia_testers (device_id, display_name) values ('legacy-null-token', 'x')`;
    assert.equal(await assertDeviceCore(sql, "legacy-null-token", "a".repeat(64)), false);
    const rows = await sql<{ token: string | null }>`select token from savia_testers where device_id = 'legacy-null-token'`;
    assert.equal(rows[0]!.token, null, "token must not be written by assertDevice");
  });

  test("valid token passes; wrong token and unknown device fail", async () => {
    const { sql } = await freshDb();
    const r = await registerTesterCore(sql, { deviceId: DEV, displayName: "a", stage: "cycle" }, "ip");
    assert.ok(r.ok);
    assert.equal(await assertDeviceCore(sql, DEV, r.token), true);
    assert.equal(await assertDeviceCore(sql, DEV, "b".repeat(64)), false);
    assert.equal(await assertDeviceCore(sql, DEV, ""), false);
    assert.equal(await assertDeviceCore(sql, "unknown-device-1", r.token), false);
  });
});

describe("item 4: recovery codes", () => {
  test("generated from the 32-symbol alphabet, 16 chars", () => {
    for (let i = 0; i < 50; i++) {
      const c = newRecoveryCode();
      assert.equal(c.length, CODE_LENGTH);
      assert.ok([...c].every((ch) => CODE_ALPHABET.includes(ch)));
    }
    const src = readFileSync(join(import.meta.dirname, "security-core.ts"), "utf8");
    assert.match(src, /randomInt\(CODE_ALPHABET\.length\)/);
    assert.ok(!/Math\.random\(\) \* alphabet/.test(src));
  });

  test("stored as salted scrypt, never plaintext; same code → different hashes", () => {
    const c = newRecoveryCode();
    const h1 = hashRecovery(c);
    const h2 = hashRecovery(c);
    assert.match(h1, /^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    assert.notEqual(h1, h2);
    assert.ok(!h1.includes(c));
    assert.equal(verifyRecovery(c, h1), true);
    assert.equal(verifyRecovery(c.toLowerCase().replace(/(.{4})/g, "$1-"), h1), true, "grouped/lowercase input");
    assert.equal(verifyRecovery(newRecoveryCode(), h1), false);
  });

  test("recoverDevice returns the same device + token for the right code only", async () => {
    const { sql } = await freshDb();
    const r = await registerTesterCore(sql, { deviceId: DEV, displayName: "a", stage: "cycle" }, "ip");
    assert.ok(r.ok);
    const rows = await sql<{ recovery_hash: string }>`select recovery_hash from savia_testers where device_id = ${DEV}`;
    assert.match(rows[0]!.recovery_hash, /^s1\$/);
    const rec = await recoverDeviceCore(sql, r.recovery, "5.5.5.5");
    assert.deepEqual(rec, { ok: true, deviceId: DEV, token: r.token });
    assert.deepEqual(await recoverDeviceCore(sql, newRecoveryCode(), "5.5.5.5"), { ok: false });
  });

  test("recoverDevice is rate limited per IP (10/hour)", async () => {
    const { sql } = await freshDb();
    for (let i = 0; i < 10; i++) await recoverDeviceCore(sql, newRecoveryCode(), "6.6.6.6");
    assert.deepEqual(await recoverDeviceCore(sql, newRecoveryCode(), "6.6.6.6"), { ok: false, error: "rate" });
    assert.deepEqual(await recoverDeviceCore(sql, newRecoveryCode(), "7.7.7.7"), { ok: false }, "other IPs unaffected");
  });

  test("existing users: 0013 salts old hashes; old code + token keep working; rehash on use", async () => {
    const legacyCode = "ABCD2345";
    const legacyToken = "t".repeat(64);
    const { sql } = await freshDb({
      seedLegacy: async (pg) => {
        await pg.query(
          "insert into savia_testers (device_id, display_name, token, recovery_hash) values ($1, $2, $3, $4)",
          ["legacy-device-0001", "Claudia", legacyToken, sha256Hex(legacyCode)],
        );
      },
    });
    const before = await sql<{ recovery_hash: string; token: string; display_name: string }>`
      select recovery_hash, token, display_name from savia_testers where device_id = 'legacy-device-0001'`;
    assert.match(before[0]!.recovery_hash, /^lsha\$[0-9a-f]{32}\$[0-9a-f]{64}$/, "0013 salted the legacy hash");
    assert.equal(before[0]!.token, legacyToken, "token untouched");
    assert.equal(before[0]!.display_name, "Claudia");
    assert.equal(await assertDeviceCore(sql, "legacy-device-0001", legacyToken), true, "existing token still valid");

    const rec = await recoverDeviceCore(sql, "abcd 2345", "8.8.8.8");
    assert.deepEqual(rec, { ok: true, deviceId: "legacy-device-0001", token: legacyToken });
    const after = await sql<{ recovery_hash: string }>`select recovery_hash from savia_testers where device_id = 'legacy-device-0001'`;
    assert.match(after[0]!.recovery_hash, /^s1\$/, "re-hashed with scrypt on use");
    assert.deepEqual(await recoverDeviceCore(sql, legacyCode, "8.8.8.8"), rec, "same code still works after rehash");
    assert.deepEqual(await recoverDeviceCore(sql, "ZZZZ2345", "8.8.8.8"), { ok: false });
  });
});

describe("item 5: admin PIN fails closed", () => {
  test("no SAVIA_ADMIN_PIN → disabled, even for the old 'savia-casa' default", async () => {
    const { sql } = await freshDb();
    assert.equal(adminPinOk("savia-casa", undefined), false);
    assert.equal(adminPinOk("savia-casa", ""), false);
    assert.equal(adminPinOk("", "   "), false);
    assert.deepEqual(await listTestersCore(sql, "savia-casa", undefined, "ip"), { ok: false, error: "disabled" });
    assert.deepEqual(await listTestersCore(sql, "savia-casa", "", "ip"), { ok: false, error: "disabled" });
    const src = readFileSync(join(import.meta.dirname, "testers.ts"), "utf8");
    assert.ok(!src.includes('"savia-casa"'), "no hardcoded fallback PIN");
  });

  test("with a PIN set: right PIN lists (no tokens/hashes), wrong PIN rejected, attempts rate limited", async () => {
    const { sql } = await freshDb();
    await registerTesterCore(sql, { deviceId: DEV, displayName: "a", stage: "cycle" }, "ip");
    assert.deepEqual(await listTestersCore(sql, "nope", "correct-horse-9", "ip1"), { ok: false, error: "pin" });
    const ok = await listTestersCore(sql, "correct-horse-9", "correct-horse-9", "ip1");
    assert.ok(ok.ok && ok.count === 1);
    assert.ok(ok.ok && !("token" in ok.rows[0]!) && !("recovery_hash" in ok.rows[0]!));
    for (let i = 0; i < 10; i++) await listTestersCore(sql, "nope", "correct-horse-9", "ip2");
    assert.deepEqual(await listTestersCore(sql, "correct-horse-9", "correct-horse-9", "ip2"), { ok: false, error: "rate" });
  });
});

describe("items 1–2: plan and payments", () => {
  const src = () => readFileSync(join(import.meta.dirname, "savia-server.ts"), "utf8");

  test("claimSerena no longer exists (plans only via Whop webhook / admin)", () => {
    assert.ok(!/claimSerena/.test(src()));
    const pagar = readFileSync(join(import.meta.dirname, "../routes/pagar.tsx"), "utf8");
    assert.ok(!/claimSerena/.test(pagar));
  });

  test("markZinliPaid/joinWaitlist: session or rate limit + validation; never update a plan", () => {
    const s = src();
    const mark = s.slice(s.indexOf("export const markZinliPaid"), s.indexOf("const FREE_ASKS"));
    assert.match(mark, /middleware\(\[authMiddleware\]\)/);
    assert.match(mark, /paymentReportSchema/);
    assert.match(mark, /rateLimit\(/);
    assert.ok(!/update savia_profiles/.test(mark));
    const wait = s.slice(s.indexOf("export const joinWaitlist"), s.indexOf("export type PaySettings"));
    assert.match(wait, /waitlistSchema/);
    assert.match(wait, /rateLimit\(/);
  });

  test("savePay/saveZinli are admin-gated", () => {
    const s = src();
    const save = s.slice(s.indexOf("export const savePay"), s.indexOf("export const markZinliPaid"));
    assert.equal(save.match(/isAdminUser\(context\.userId\)/g)?.length, 2);
  });

  test("admin identity: only listed ids/emails; empty list → nobody", () => {
    assert.equal(isAdminIdentity({ id: "u1", email: "ventas@anclagroupmcbo.com" }, ""), false);
    assert.equal(isAdminIdentity({ id: "u1", email: "x@y.com" }, "ventas@anclagroupmcbo.com"), false);
    assert.equal(isAdminIdentity({ id: "u1", email: "Ventas@AnclaGroupMCBO.com" }, "a@b.c, ventas@anclagroupmcbo.com"), true);
    assert.equal(isAdminIdentity({ id: "admin-id", email: null }, "admin-id"), true);
  });

  test("payment report + waitlist inputs validated", () => {
    assert.equal(paymentReportSchema.safeParse({ email: "no-at", plan: "serena", note: "" }).success, false);
    assert.equal(paymentReportSchema.safeParse({ email: "a@b.co", plan: "gold", note: "" }).success, false);
    assert.equal(paymentReportSchema.safeParse({ email: "a@b.co", plan: "year", note: "x".repeat(301) }).success, false);
    assert.equal(paymentReportSchema.safeParse({ email: " A@B.co ", plan: "year", note: "zinli" }).success, true);
    assert.equal(waitlistSchema.safeParse({ email: "a@b.co", plan: "serena" }).success, true);
    assert.equal(waitlistSchema.safeParse({ email: "x".repeat(300) + "@b.co", plan: "serena" }).success, false);
  });

  test("Serena comps come from SERENA_COMP_EMAILS (no hardcoded address)", () => {
    assert.equal(isCompSerenaEmail("claufaria_14@hotmail.com", "claufaria_14@hotmail.com"), true);
    assert.equal(isCompSerenaEmail(" ClauFaria_14@Hotmail.com ", "a@b.c, claufaria_14@hotmail.com"), true);
    assert.equal(isCompSerenaEmail("claufaria_14@hotmail.com", ""), false);
    assert.equal(isCompSerenaEmail("other@x.com", "claufaria_14@hotmail.com"), false);
    const comps = readFileSync(join(import.meta.dirname, "serena-comps.ts"), "utf8");
    assert.ok(!comps.includes("@hotmail.com"));
  });
});

describe("item 3: AI input caps + rate limiter", () => {
  const creds = { deviceId: DEV, token: "a".repeat(64) };
  test("chat requires device creds and caps sizes (incl. file)", () => {
    assert.equal(askOpenSchema.safeParse({ question: "hola", locale: "es" }).success, false);
    assert.equal(askOpenSchema.safeParse({ ...creds, question: "hola", locale: "es" }).success, true);
    assert.equal(askOpenSchema.safeParse({ ...creds, question: "x".repeat(4001), locale: "es" }).success, false);
    assert.equal(
      askOpenSchema.safeParse({ ...creds, question: "hola", locale: "es", history: Array(21).fill({ role: "user", content: "x" }) }).success,
      false,
    );
    assert.equal(
      askOpenSchema.safeParse({ ...creds, question: "hola", locale: "es", history: [{ role: "system", content: "x" }] }).success,
      false,
    );
    assert.equal(askOpenSchema.safeParse({ ...creds, question: "hola", locale: "es", file: { userNote: "x".repeat(2001) } }).success, false);
    assert.equal(askOpenSchema.safeParse({ ...creds, question: "hola", locale: "es", file: { symptoms: Array(41).fill("a") } }).success, false);
  });

  test("daily note requires device creds and caps sizes", () => {
    assert.equal(noteOpenSchema.safeParse({ locale: "es", facts: "", draft: "" }).success, false);
    assert.equal(noteOpenSchema.safeParse({ ...creds, locale: "es", facts: "x".repeat(4001), draft: "" }).success, false);
    assert.equal(noteOpenSchema.safeParse({ ...creds, locale: "es", facts: "ok", draft: "ok" }).success, true);
  });

  test("rateLimit allows up to the limit per window, then denies; new window resets", async () => {
    const { sql } = await freshDb();
    const t0 = Date.UTC(2026, 8, 26, 12, 0, 0);
    for (let i = 0; i < 3; i++) assert.equal(await rateLimit(sql, "t", "k", 3, 600, t0), true);
    assert.equal(await rateLimit(sql, "t", "k", 3, 600, t0 + 1000), false);
    assert.equal(await rateLimit(sql, "t", "other", 3, 600, t0), true);
    assert.equal(await rateLimit(sql, "t", "k", 3, 600, t0 + 600_000), true);
  });
});
