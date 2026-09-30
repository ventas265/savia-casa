import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

/**
 * Wipe this device's server rows. Same credential as the rest of the beta app.
 * The core is imported lazily so node:crypto stays off the client bundle.
 */
export const deleteMyData = createServerFn({ method: "POST" })
  .validator((input: { deviceId?: string; token?: string }) => ({
    deviceId: String(input?.deviceId || ""),
    token: String(input?.token || ""),
  }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const { deleteDeviceDataCore } = await import("@/lib/delete-device-core");
    return deleteDeviceDataCore(sql, data.deviceId, data.token);
  });
