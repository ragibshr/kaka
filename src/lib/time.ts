/** Minutes east of UTC for a timezone at a given instant (e.g. Asia/Dubai → 240). */
export function tzOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / 60000);
}

function offsetString(mins: number): string {
  const sign = mins >= 0 ? "+" : "-";
  const a = Math.abs(mins);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

/** Local wall-clock time as ISO-8601 with offset, e.g. 2026-11-11T15:30:00+04:00 */
export function localIso(timeZone: string, at: Date = new Date()): string {
  const off = tzOffsetMinutes(timeZone, at);
  const local = new Date(at.getTime() + off * 60000);
  return local.toISOString().slice(0, 19) + offsetString(off);
}

/** YYYY-MM-DD in the given timezone */
export function localDate(timeZone: string, at: Date = new Date()): string {
  return localIso(timeZone, at).slice(0, 10);
}

/** UTC instants for the start and end of the local day containing `at`. */
export function dayBounds(timeZone: string, at: Date = new Date()): { start: string; end: string } {
  const off = tzOffsetMinutes(timeZone, at);
  const date = localDate(timeZone, at);
  const startUtc = Date.parse(`${date}T00:00:00Z`) - off * 60000;
  return { start: new Date(startUtc).toISOString(), end: new Date(startUtc + 86400000).toISOString() };
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
