/**
 * Beta-device auth logic (savia_testers), DB-injected so node:test can run it
 * against PGLite. Wrapped by server functions in testers.ts.
 */
import {
  adminPinOk,
  codeSelector,
  CODE_LENGTH,
  formatCode,
  hashRecovery,
  newDeviceToken,
  newRecoveryCode,
  normalizeCode,
  rateKey,
  rateLimit,
  recoveryHashKind,
  safeEqual,
  verifyRecovery,
  type SqlTag,
} from "./security-core.ts";

export function okDeviceId(id: string): boolean {
  return typeof id === "string" && id.length >= 8 && id.length <= 80;
}

/** Valid only when the row exists AND already has this exact token. No trust-on-first-use. */
export async function assertDeviceCore(sql: SqlTag, deviceId: string, token: string): Promise<boolean> {
  if (!okDeviceId(deviceId) || typeof token !== "string" || token.length < 16 || token.length > 200) return false;
  const rows = await sql<{ token: string | null }>`
    select token from savia_testers where device_id = ${deviceId} limit 1
  `;
  const stored = rows[0]?.token;
  if (!stored) return false;
  return safeEqual(stored, token);
}

export type RegisterInput = {
  deviceId: string;
  displayName: string;
  stage: string;
  country?: string;
  token?: string;
};

export type RegisterResult =
  | { ok: true; token: string; recovery: string }
  | { ok: false; token: ""; recovery: ""; error: "id" | "taken" | "rate" };

/**
 * - New device → creates the row, returns a fresh token + a one-time recovery code.
 * - Existing device with its valid token → refreshes last_seen/stage/country only
 *   (never the name, never re-sends the token or a code).
 * - Existing device without the valid token → rejected (use the recovery code).
 */
export async function registerTesterCore(sql: SqlTag, input: RegisterInput, ip: string): Promise<RegisterResult> {
  const id = String(input.deviceId || "").trim();
  if (!okDeviceId(id)) return { ok: false, token: "", recovery: "", error: "id" };
  const stage = String(input.stage || "cycle").slice(0, 20) || "cycle";
  const country = String(input.country || "VE").slice(0, 4);
  if (input.token && (await assertDeviceCore(sql, id, input.token))) {
    await sql`
      update savia_testers set stage = ${stage}, country = ${country}, last_seen = now()
      where device_id = ${id}
    `;
    return { ok: true, token: "", recovery: "" };
  }
  if (!(await rateLimit(sql, "register", rateKey(ip), 20, 3600))) {
    return { ok: false, token: "", recovery: "", error: "rate" };
  }
  const name = String(input.displayName || "").trim().slice(0, 80);
  const token = newDeviceToken();
  const code = newRecoveryCode();
  const inserted = await sql<{ device_id: string }>`
    insert into savia_testers (device_id, display_name, stage, country, token, recovery_hash, recovery_selector)
    values (${id}, ${name}, ${stage}, ${country}, ${token}, ${hashRecovery(code)}, ${codeSelector(code)})
    on conflict (device_id) do nothing
    returning device_id
  `;
  if (!inserted[0]) return { ok: false, token: "", recovery: "", error: "taken" };
  return { ok: true, token, recovery: formatCode(code) };
}

export type RecoverResult =
  | { ok: true; deviceId: string; token: string }
  | { ok: false; error?: "rate" };

/**
 * Recovery code → device credentials. Rate-limited per IP (and globally).
 * Current codes (16 chars) are found by selector and verified with scrypt.
 * Pre-0013 codes (8 chars) are verified against their salted legacy hash and
 * then re-hashed with scrypt on success (same code keeps working).
 */
export async function recoverDeviceCore(sql: SqlTag, rawCode: string, ip: string): Promise<RecoverResult> {
  if (!(await rateLimit(sql, "recover", rateKey(ip), 10, 3600))) return { ok: false, error: "rate" };
  if (!(await rateLimit(sql, "recover-all", "global", 300, 3600))) return { ok: false, error: "rate" };
  const code = normalizeCode(rawCode);
  if (code.length < 6 || code.length > 32) return { ok: false };
  let match: { device_id: string; token: string | null; recovery_hash: string | null } | undefined;
  if (code.length === CODE_LENGTH) {
    const rows = await sql<{ device_id: string; token: string | null; recovery_hash: string | null }>`
      select device_id, token, recovery_hash from savia_testers
      where recovery_selector = ${codeSelector(code)}
      limit 20
    `;
    match = rows.find((r) => verifyRecovery(code, r.recovery_hash));
  } else {
    // Legacy codes: bounded set (no new ones are ever created without a selector).
    const rows = await sql<{ device_id: string; token: string | null; recovery_hash: string | null }>`
      select device_id, token, recovery_hash from savia_testers
      where recovery_selector is null and recovery_hash is not null
      limit 500
    `;
    match = rows.find((r) => verifyRecovery(code, r.recovery_hash));
    if (match && recoveryHashKind(match.recovery_hash) !== "s1") {
      await sql`
        update savia_testers set recovery_hash = ${hashRecovery(code)}
        where device_id = ${match.device_id}
      `;
    }
  }
  if (!match) return { ok: false };
  let token = match.token;
  if (!token) {
    token = newDeviceToken();
    await sql`update savia_testers set token = ${token} where device_id = ${match.device_id} and token is null`;
    const again = await sql<{ token: string | null }>`select token from savia_testers where device_id = ${match.device_id}`;
    token = again[0]?.token || token;
  }
  await sql`update savia_testers set last_seen = now() where device_id = ${match.device_id}`;
  return { ok: true, deviceId: match.device_id, token };
}

export type TesterRow = {
  display_name: string;
  stage: string;
  country: string;
  created_at: string;
  last_seen: string;
};

export async function listTestersCore(
  sql: SqlTag,
  pin: string,
  expectedPin: string | undefined,
  ip: string,
): Promise<{ ok: true; count: number; rows: TesterRow[] } | { ok: false; error: "pin" | "disabled" | "rate" }> {
  if (!String(expectedPin || "").trim()) return { ok: false, error: "disabled" };
  if (!(await rateLimit(sql, "admin-pin", rateKey(ip), 10, 3600))) return { ok: false, error: "rate" };
  if (!adminPinOk(pin, expectedPin)) return { ok: false, error: "pin" };
  const rows = await sql<TesterRow>`
    select display_name, stage, country, created_at::text, last_seen::text
    from savia_testers
    order by last_seen desc
    limit 200
  `;
  return { ok: true, count: rows.length, rows };
}
