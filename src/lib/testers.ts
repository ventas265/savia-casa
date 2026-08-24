import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

function okId(id: string) {
  return id.length >= 8 && id.length <= 80;
}

async function sha(s: string) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(s).digest("hex");
}

function newCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function newToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
}

export async function assertDevice(deviceId: string, token: string) {
  if (!okId(deviceId) || token.length < 16) return false;
  const sql = await getSql();
  const rows = await sql<{ token: string | null }>`
    select token from savia_testers where device_id = ${deviceId} limit 1
  `;
  const row = rows[0];
  if (!row) return false;
  if (!row.token) {
    await sql`update savia_testers set token = ${token}, last_seen = now() where device_id = ${deviceId} and token is null`;
    return true;
  }
  return row.token === token;
}

export const registerTester = createServerFn({ method: "POST" })
  .validator((input: { deviceId: string; displayName: string; stage: string; country?: string }) => input)
  .handler(async ({ data }) => {
    const id = data.deviceId.trim().slice(0, 80);
    if (!okId(id)) return { ok: false as const, token: "", recovery: "" };
    const sql = await getSql();
    const name = data.displayName.trim().slice(0, 80);
    const stage = data.stage.slice(0, 20) || "cycle";
    const country = (data.country || "VE").slice(0, 4);
    const existing = await sql<{ token: string | null; recovery_hash: string | null }>`
      select token, recovery_hash from savia_testers where device_id = ${id} limit 1
    `;
    const prev = existing[0];
    const token = prev?.token || newToken();
    let recovery = "";
    let recoveryHash = prev?.recovery_hash || "";
    if (!recoveryHash) {
      recovery = newCode();
      recoveryHash = await sha(recovery.toUpperCase());
    }
    await sql`
      insert into savia_testers (device_id, display_name, stage, country, token, recovery_hash)
      values (${id}, ${name}, ${stage}, ${country}, ${token}, ${recoveryHash})
      on conflict (device_id) do update set
        display_name = excluded.display_name,
        stage = excluded.stage,
        country = excluded.country,
        token = coalesce(savia_testers.token, excluded.token),
        recovery_hash = coalesce(savia_testers.recovery_hash, excluded.recovery_hash),
        last_seen = now()
    `;
    return { ok: true as const, token, recovery };
  });

export const recoverDevice = createServerFn({ method: "POST" })
  .validator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase().replaceAll(" ", "");
    if (code.length < 6) return { ok: false as const };
    const hash = await sha(code);
    const sql = await getSql();
    const rows = await sql<{ device_id: string; token: string | null }>`
      select device_id, token from savia_testers where recovery_hash = ${hash} limit 1
    `;
    const row = rows[0];
    if (!row) return { ok: false as const };
    const token = row.token || newToken();
    if (!row.token) {
      await sql`update savia_testers set token = ${token}, last_seen = now() where device_id = ${row.device_id}`;
    }
    return { ok: true as const, deviceId: row.device_id, token };
  });

export const listTesters = createServerFn({ method: "POST" })
  .validator((input: { pin: string }) => input)
  .handler(async ({ data }) => {
    const { timingSafeEqual } = await import("node:crypto");
    const expected = process.env.SAVIA_ADMIN_PIN || "savia-casa";
    const a = Buffer.from(data.pin.trim());
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false as const, error: "pin" as const };
    }
    const sql = await getSql();
    const rows = await sql<{
      display_name: string;
      stage: string;
      country: string;
      created_at: string;
      last_seen: string;
    }>`
      select display_name, stage, country, created_at::text, last_seen::text
      from savia_testers
      order by last_seen desc
      limit 200
    `;
    return { ok: true as const, count: rows.length, rows };
  });
