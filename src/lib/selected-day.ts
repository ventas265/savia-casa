/** Calendar → Registro day handoff (session). */

const KEY = "savia.registroDay";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDay(value: string): boolean {
  return ISO.test(value);
}

export function getSelectedDay(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v && isIsoDay(v) ? v : null;
  } catch {
    return null;
  }
}

export function setSelectedDay(day: string) {
  if (!isIsoDay(day)) return;
  try {
    sessionStorage.setItem(KEY, day);
  } catch {
    /* private mode */
  }
}

export function clearSelectedDay() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Prefer ?day=, then calendar handoff, then today. */
export function resolveRegistroDay(searchDay: string | undefined, today: string): string {
  if (searchDay && isIsoDay(searchDay)) return searchDay;
  const picked = getSelectedDay();
  if (picked) return picked;
  return today;
}
