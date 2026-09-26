/**
 * Complimentary Serena accounts, from env SERENA_COMP_EMAILS (comma-separated).
 * Read at call time so a Vercel env change applies without a code change.
 */
export function compSerenaEmails(raw = process.env.SERENA_COMP_EMAILS): Set<string> {
  return new Set(
    String(raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isCompSerenaEmail(email: string | null | undefined, raw = process.env.SERENA_COMP_EMAILS): boolean {
  return email != null && compSerenaEmails(raw).has(email.trim().toLowerCase());
}
