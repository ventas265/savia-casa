import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

const PIN = "savia-casa";

export const registerTester = createServerFn({ method: "POST" })
  .validator((input: { deviceId: string; displayName: string; stage: string; country?: string }) => input)
  .handler(async ({ data }) => {
    const id = data.deviceId.trim().slice(0, 80);
    if (id.length < 8) return { ok: false as const };
    const sql = await getSql();
    const name = data.displayName.trim().slice(0, 80);
    const stage = data.stage.slice(0, 20) || "cycle";
    const country = (data.country || "VE").slice(0, 4);
    await sql`
      insert into savia_testers (device_id, display_name, stage, country)
      values (${id}, ${name}, ${stage}, ${country})
      on conflict (device_id) do update set
        display_name = excluded.display_name,
        stage = excluded.stage,
        country = excluded.country,
        last_seen = now()
    `;
    return { ok: true as const };
  });

export const listTesters = createServerFn({ method: "POST" })
  .validator((input: { pin: string }) => input)
  .handler(async ({ data }) => {
    if (data.pin.trim() !== PIN) return { ok: false as const, error: "pin" as const };
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
