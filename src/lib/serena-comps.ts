const SERENA_COMP_EMAILS = new Set([
  "claufaria_14@hotmail.com",
]);

export function isCompSerenaEmail(email: string | null | undefined): boolean {
  return email != null && SERENA_COMP_EMAILS.has(email.trim().toLowerCase());
}
