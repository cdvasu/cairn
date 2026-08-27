/** All dates are handled in the user's local timezone as `YYYY-MM-DD` strings. */

export function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Sunday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

export function formatLong(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatShort(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeLabel(key: string): string | null {
  const today = todayKey();
  if (key === today) return "Today";
  if (key === toKey(addDays(new Date(), -1))) return "Yesterday";
  return null;
}

export const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];
