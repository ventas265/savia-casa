import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { learnedCycle } from "@/lib/cycle";
import { getOrCreateProfile, snapshotFor } from "@/lib/savia-server";
import type { Flow, Intention, Mucus, SexKind, Stage, TodaySnapshot } from "@/lib/types";

function okId(id: string) {
  return id.length >= 8 && id.length <= 80;
}

export const getTodayDevice = createServerFn({ method: "POST" })
  .validator((input: { deviceId: string }) => input)
  .handler(async ({ data }): Promise<TodaySnapshot | null> => {
    if (!okId(data.deviceId)) return null;
    return snapshotFor(data.deviceId);
  });

export const saveProfileDevice = createServerFn({ method: "POST" })
  .validator(
    (input: {
      deviceId: string;
      displayName: string;
      stage: Stage;
      birthYear: number | null;
      cycleLength: number;
      periodLength: number;
      lastPeriodStart: string | null;
      dueDate: string | null;
      lastPeriodYear: number | null;
      onboardingDone: boolean;
      locale: string;
      intention?: Intention;
    }) => input,
  )
  .handler(async ({ data }) => {
    if (!okId(data.deviceId)) return { ok: false as const };
    const sql = await getSql();
    const userId = data.deviceId;
    await getOrCreateProfile(userId);
    await sql`
      update savia_profiles set
        display_name = ${data.displayName.trim()},
        stage = ${data.stage},
        birth_year = ${data.birthYear},
        cycle_length = ${data.cycleLength},
        period_length = ${data.periodLength},
        last_period_start = ${data.lastPeriodStart},
        due_date = ${data.dueDate},
        last_period_year = ${data.lastPeriodYear},
        onboarding_done = ${data.onboardingDone},
        locale = ${data.locale},
        intention = ${data.intention || "track"},
        plan = 'serena',
        updated_at = now()
      where user_id = ${userId}
    `;
    if (data.lastPeriodStart) {
      await sql`
        insert into period_starts (user_id, start_date)
        values (${userId}, ${data.lastPeriodStart})
        on conflict (user_id, start_date) do nothing
      `;
    }
    return { ok: true as const };
  });

export const saveLogDevice = createServerFn({ method: "POST" })
  .validator(
    (input: {
      deviceId: string;
      day: string;
      flow: Flow;
      mood: number | null;
      energy: number | null;
      sleepHours: number | null;
      notes: string;
      symptoms: string[];
      periodStarted: boolean;
      mucus?: Mucus;
      sex?: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    if (!okId(data.deviceId)) return { ok: false as const };
    const sql = await getSql();
    const userId = data.deviceId;
    const profile = await getOrCreateProfile(userId);
    const symptomsJson = JSON.stringify(data.symptoms);
    const mucus = data.mucus || "none";
    await sql`
      insert into daily_logs (
        user_id, day, flow, mood, energy, sleep_hours, notes, symptoms, period_started, mucus, sex, updated_at
      ) values (
        ${userId}, ${data.day}, ${data.flow}, ${data.mood}, ${data.energy},
        ${data.sleepHours}, ${data.notes.trim()}, ${symptomsJson}::jsonb, ${data.periodStarted}, ${mucus}, ${Boolean(data.sex)}, now()
      )
      on conflict (user_id, day) do update set
        flow = excluded.flow,
        mood = excluded.mood,
        energy = excluded.energy,
        sleep_hours = excluded.sleep_hours,
        notes = excluded.notes,
        symptoms = excluded.symptoms,
        period_started = excluded.period_started,
        mucus = excluded.mucus,
        sex = excluded.sex,
        updated_at = now()
    `;
    if (data.periodStarted) {
      const nextLen = learnedCycle(profile.lastPeriodStart, data.day, profile.cycleLength);
      await sql`
        insert into period_starts (user_id, start_date)
        values (${userId}, ${data.day})
        on conflict (user_id, start_date) do nothing
      `;
      await sql`
        update savia_profiles
        set last_period_start = ${data.day}, cycle_length = ${nextLen}, updated_at = now()
        where user_id = ${userId}
      `;
    }
    return { ok: true as const };
  });

export const saveSexDevice = createServerFn({ method: "POST" })
  .validator((input: { deviceId: string; day: string; kind: SexKind }) => input)
  .handler(async ({ data }) => {
    if (!okId(data.deviceId)) return { ok: false as const };
    const sql = await getSql();
    const on = data.kind !== "none";
    await sql`
      insert into daily_logs (user_id, day, sex, sex_kind, updated_at)
      values (${data.deviceId}, ${data.day}, ${on}, ${data.kind}, now())
      on conflict (user_id, day) do update set
        sex = ${on},
        sex_kind = ${data.kind},
        updated_at = now()
    `;
    return { ok: true as const };
  });
