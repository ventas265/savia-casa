import { createHmac, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";

export function verifyWhopSignature(raw: string, headers: Headers, secret: string): boolean {
  const id = headers.get("webhook-id") ?? "";
  const ts = headers.get("webhook-timestamp") ?? "";
  const header = headers.get("webhook-signature") ?? "";
  if (!id || !ts || !header || !secret) return false;
  const signed = `${id}.${ts}.${raw}`;
  const expected = createHmac("sha256", secret).update(signed).digest("base64");
  const got = header
    .split(" ")
    .map((part) => part.trim())
    .find((part) => part.startsWith("v1,"))
    ?.slice(3);
  if (!got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function pickEmail(data: Record<string, unknown>): string {
  const user = data.user as Record<string, unknown> | undefined;
  const membership = data.membership as Record<string, unknown> | undefined;
  const mUser = membership?.user as Record<string, unknown> | undefined;
  const raw =
    (typeof user?.email === "string" && user.email) ||
    (typeof mUser?.email === "string" && mUser.email) ||
    (typeof data.email === "string" && data.email) ||
    "";
  return raw.trim().toLowerCase();
}

function pickPlanId(data: Record<string, unknown>): string {
  const plan = data.plan as Record<string, unknown> | undefined;
  const membership = data.membership as Record<string, unknown> | undefined;
  const mPlan = membership?.plan as Record<string, unknown> | undefined;
  const id = plan?.id ?? mPlan?.id ?? data.plan_id;
  return typeof id === "string" ? id : "";
}

export function planFromWhop(planId: string): "serena" | "year" {
  const year = process.env.WHOP_PLAN_YEAR_ID?.trim();
  if (year && planId && planId === year) return "year";
  return "serena";
}

export async function grantSerenaByEmail(email: string, plan: "serena" | "year", note: string) {
  if (!email.includes("@")) return { ok: false as const };
  const amount = plan === "year" ? 39 : 4.99;
  const sql = await getSql();
  await sql`
    insert into savia_payments (email, plan, amount, note)
    values (${email}, ${plan}, ${amount}, ${note})
  `;
  const users = await sql<{ id: string }>`
    select id from "user" where lower(email) = ${email} limit 1
  `;
  const userId = users[0]?.id;
  if (!userId) return { ok: true as const, matched: false };
  await sql`
    insert into savia_profiles (user_id, plan)
    values (${userId}, ${plan})
    on conflict (user_id) do update set plan = excluded.plan, updated_at = now()
  `;
  return { ok: true as const, matched: true };
}

export async function handleWhopEvent(body: Record<string, unknown>) {
  const type = String(body.type ?? "");
  if (type !== "payment.succeeded" && type !== "membership.activated") {
    return { ok: true as const, ignored: type };
  }
  const data = (body.data && typeof body.data === "object" ? body.data : body) as Record<
    string,
    unknown
  >;
  const email = pickEmail(data);
  const plan = planFromWhop(pickPlanId(data));
  const grant = await grantSerenaByEmail(email, plan, `whop:${type}`);
  return { ok: true as const, type, email: email ? "yes" : "no", plan, grant };
}