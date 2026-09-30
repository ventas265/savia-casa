/**
 * Delete every server row tied to one device credential.
 * Pure (SQL injected) so node:test can run it on PGLite.
 *
 * Auth is the existing device token (assertDeviceCore). No trust-on-first-use.
 * Fails closed: a missing or wrong token deletes nothing.
 *
 * Per-device only. Does not touch other devices, savia_settings, savia_payments,
 * savia_waitlist, Better Auth tables, or rate-limit buckets that are per IP
 * or global (those are not this device's rows).
 *
 * The tester row is deleted last so a failed earlier step can be retried
 * with the same credential. A second call after success is rejected (the
 * credential is gone) and deletes nothing else.
 */
import { rateKey, type SqlTag } from "./security-core.ts";
import { assertDeviceCore } from "./testers-core.ts";

/**
 * Scopes whose bucket key is rateKey(deviceId) in savia-server.ts.
 * IP and global scopes are intentionally absent.
 */
export const DEVICE_RATE_SCOPES = ["ai-chat-d10m", "ai-chat-dday", "ai-note-dh"] as const;

export type DeleteDeviceResult =
  | {
      ok: true;
      removed: {
        logs: number;
        starts: number;
        push: number;
        profile: number;
        legacy: number;
        rateLimits: number;
        tester: number;
      };
    }
  | { ok: false; error: "auth" };

async function removed(query: Promise<unknown[]>): Promise<number> {
  const rows = await query;
  return rows.length;
}

export async function deleteDeviceDataCore(
  sql: SqlTag,
  deviceId: string,
  token: string,
): Promise<DeleteDeviceResult> {
  if (!(await assertDeviceCore(sql, String(deviceId || ""), String(token || "")))) {
    return { ok: false, error: "auth" };
  }
  const id = String(deviceId);

  const logs = await removed(sql`delete from daily_logs where user_id = ${id} returning user_id`);
  const starts = await removed(sql`delete from period_starts where user_id = ${id} returning user_id`);
  const push = await removed(sql`delete from push_subscriptions where user_id = ${id} returning user_id`);
  const profile = await removed(sql`delete from savia_profiles where user_id = ${id} returning user_id`);

  // Older schema (profiles / services / quotes / waitlist). The current app
  // does not write cycle data there, but rows are per user_id if any exist.
  const services = await removed(sql`delete from services where user_id = ${id} returning user_id`);
  const quotes = await removed(sql`delete from quotes where user_id = ${id} returning user_id`);
  const profiles = await removed(sql`delete from profiles where user_id = ${id} returning user_id`);
  const waitlist = await removed(sql`delete from waitlist where user_id = ${id} returning id`);

  const key = rateKey(id);
  let rateLimits = 0;
  for (const scope of DEVICE_RATE_SCOPES) {
    const bucket = `${scope}:${key}`;
    rateLimits += await removed(sql`delete from savia_rate_limits where bucket = ${bucket} returning bucket`);
  }

  const tester = await removed(sql`delete from savia_testers where device_id = ${id} returning device_id`);

  return {
    ok: true,
    removed: {
      logs,
      starts,
      push,
      profile,
      legacy: services + quotes + profiles + waitlist,
      rateLimits,
      tester,
    },
  };
}
