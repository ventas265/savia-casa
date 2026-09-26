/**
 * Security primitives shared by server functions and node:test.
 * Pure Node (node:crypto) + relative imports only — no "@/..." aliases and no
 * TanStack imports, so `node --test --experimental-strip-types` can load it.
 */
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/** Minimal tagged-template SQL surface (matches `Sql` in db.ts). */
export type SqlTag = <T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/** Constant-time string compare (hash both sides so lengths always match). */
export function safeEqual(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y) && a.length === b.length;
}

// ---------------------------------------------------------------- recovery codes

/** No 0/O/1/I: easy to copy by hand. 32 symbols = 5 bits each. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** 16 symbols = 80 bits. First 4 are a public lookup selector. */
export const CODE_LENGTH = 16;
export const SELECTOR_LENGTH = 4;

export function newRecoveryCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return out;
}

/** "abcd-efgh jklm" → "ABCDEFGHJKLM" (users paste the grouped form). */
export function normalizeCode(code: string): string {
  return String(code || "")
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .slice(0, 64);
}

/** Display form: XXXX-XXXX-XXXX-XXXX. */
export function formatCode(code: string): string {
  return (normalizeCode(code).match(/.{1,4}/g) || []).join("-");
}

export function codeSelector(code: string): string {
  return normalizeCode(code).slice(0, SELECTOR_LENGTH);
}

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

/** Salted scrypt: `s1$<salt hex>$<hash hex>`. */
export function hashRecovery(code: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(normalizeCode(code), salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  }).toString("hex");
  return `s1$${salt}$${hash}`;
}

export type RecoveryHashKind = "s1" | "lsha" | "legacy" | "unknown";

export function recoveryHashKind(stored: string | null | undefined): RecoveryHashKind {
  if (!stored) return "unknown";
  if (stored.startsWith("s1$")) return "s1";
  if (stored.startsWith("lsha$")) return "lsha";
  if (/^[0-9a-f]{64}$/.test(stored)) return "legacy";
  return "unknown";
}

/**
 * Verify a code against any stored format:
 * - `s1$salt$scrypt` (current)
 * - `lsha$salt$sha256(salt || sha256(code))` (pre-0013 codes, salted by migration 0013)
 * - bare `sha256(code)` (pre-0013, in case the migration has not run yet)
 */
export function verifyRecovery(code: string, stored: string | null | undefined): boolean {
  const c = normalizeCode(code);
  if (!c || !stored) return false;
  const kind = recoveryHashKind(stored);
  if (kind === "s1") {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    const got = scryptSync(c, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
    const want = Buffer.from(hash, "hex");
    return want.length === got.length && timingSafeEqual(got, want);
  }
  if (kind === "lsha") {
    const [, salt, hash] = stored.split("$");
    if (!salt || !hash) return false;
    return safeEqual(sha256Hex(salt + sha256Hex(c)), hash);
  }
  if (kind === "legacy") return safeEqual(sha256Hex(c), stored);
  return false;
}

// ---------------------------------------------------------------- device tokens

export function newDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------- admin

export function parseList(raw: string | null | undefined): string[] {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Admin = user id or email listed in SAVIA_ADMIN_EMAILS. Empty list → nobody. */
export function isAdminIdentity(
  identity: { id?: string | null; email?: string | null },
  rawList: string | null | undefined,
): boolean {
  const list = parseList(rawList);
  if (!list.length) return false;
  const id = (identity.id || "").trim().toLowerCase();
  const email = (identity.email || "").trim().toLowerCase();
  return Boolean((id && list.includes(id)) || (email && list.includes(email)));
}

/** Admin PIN check. Fails closed when SAVIA_ADMIN_PIN is missing/blank. */
export function adminPinOk(pin: string | null | undefined, expected: string | null | undefined): boolean {
  const want = String(expected || "").trim();
  if (!want) return false;
  const got = String(pin || "").trim();
  if (!got) return false;
  return safeEqual(got, want);
}

// ---------------------------------------------------------------- rate limiting

/** Short, non-reversible bucket key (never store raw IPs). */
export function rateKey(...parts: (string | null | undefined)[]): string {
  return sha256Hex(parts.map((p) => String(p ?? "")).join("|")).slice(0, 32);
}

/**
 * Fixed-window counter in Postgres (`savia_rate_limits`, migration 0013).
 * Returns true when the call is allowed. Fails CLOSED: any DB error denies.
 */
export async function rateLimit(
  sql: SqlTag,
  scope: string,
  key: string,
  limit: number,
  windowSec: number,
  now = Date.now(),
): Promise<boolean> {
  const start = new Date(Math.floor(now / 1000 / windowSec) * windowSec * 1000).toISOString();
  const bucket = `${scope}:${key}`;
  try {
    const rows = await sql<{ hits: number }>`
      insert into savia_rate_limits (bucket, window_start, hits)
      values (${bucket}, ${start}, 1)
      on conflict (bucket, window_start) do update set hits = savia_rate_limits.hits + 1
      returning hits
    `;
    if (Math.random() < 0.02) {
      await sql`delete from savia_rate_limits where window_start < now() - interval '2 days'`;
    }
    return Number(rows[0]?.hits ?? Infinity) <= limit;
  } catch (err) {
    console.error("[rate-limit] failed:", (err as Error)?.message);
    return false;
  }
}
