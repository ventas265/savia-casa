/** Live Whop checkouts for Savia Serena (company Savia). */
export const WHOP_MONTH = "https://whop.com/checkout/plan_8oYRACdYj9wyG";
export const WHOP_YEAR = "https://whop.com/checkout/plan_f8y81JaRceDd0";
export const WHOP_PRODUCT = "https://whop.com/joined/savia-serena";

export function whopFor(plan: "serena" | "year") {
  return plan === "year" ? WHOP_YEAR : WHOP_MONTH;
}
