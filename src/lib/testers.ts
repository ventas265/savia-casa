import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";

/** Lazy: testers-core pulls node:crypto, which must never reach the client bundle. */
const core = () => import("@/lib/testers-core");

async function ip() {
  const { clientIp } = await import("@/lib/request-ip.server");
  return clientIp();
}

/** Device credential check (no trust-on-first-use). */
export async function assertDevice(deviceId: string, token: string) {
  const sql = await getSql();
  const { assertDeviceCore } = await core();
  return assertDeviceCore(sql, String(deviceId || ""), String(token || ""));
}

const registerSchema = z.object({
  deviceId: z.string().min(8).max(80),
  displayName: z.string().max(200),
  stage: z.string().max(40),
  country: z.string().max(8).optional(),
  token: z.string().max(200).optional(),
});

export const registerTester = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof registerSchema>) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const { registerTesterCore } = await core();
    return registerTesterCore(sql, data, await ip());
  });

const recoverSchema = z.object({ code: z.string().max(64) });

export const recoverDevice = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof recoverSchema>) => recoverSchema.parse(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const { recoverDeviceCore } = await core();
    return recoverDeviceCore(sql, data.code, await ip());
  });

const pinSchema = z.object({ pin: z.string().max(200) });

export const listTesters = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof pinSchema>) => pinSchema.parse(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    // Fails closed when SAVIA_ADMIN_PIN is not configured (no default PIN).
    const { listTestersCore } = await core();
    return listTestersCore(sql, data.pin, process.env.SAVIA_ADMIN_PIN, await ip());
  });
