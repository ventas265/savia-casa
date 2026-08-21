/** Live Whop checkouts for Savia Serena. After pay, return to the app. */
export const WHOP_MONTH = "https://whop.com/checkout/ch_DjXFx6fTsRGdmqr/";
export const WHOP_YEAR = "https://whop.com/checkout/ch_njUBwBgw0WvI4Wt/";
export const WHOP_PRODUCT = "https://whop.com/joined/savia-serena";

export function whopFor(plan: "serena" | "year") {
  return plan === "year" ? WHOP_YEAR : WHOP_MONTH;
}
