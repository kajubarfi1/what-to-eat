/** Helpers for "later" searches: is a place open at a chosen date and time? */

export interface Period {
  open?: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

export interface OpeningHours {
  openNow?: boolean;
  periods?: Period[];
  /** Monday first, e.g. "Saturday: 11:00 AM – 9:00 PM" */
  weekdayDescriptions?: string[];
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Value for an <input type="datetime-local">, in local time. */
export function toLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** An hour from now, on the hour: a sensible default for "later". */
export function defaultWhenAt(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return toLocalInputValue(d);
}

/**
 * Split "YYYY-MM-DDTHH:mm" into a weekday (0 = Sunday) and minutes into the day. We treat it as
 * wall-clock time at the place, so there is no timezone conversion to get wrong.
 */
export function parseWhen(whenAt: string): { day: number; minutes: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(whenAt);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return { day: new Date(Date.UTC(y, mo - 1, d)).getUTCDay(), minutes: h * 60 + mi };
}

/**
 * true / false if we can tell from Google's weekly hours, undefined if the place lists none
 * (unknown places are let through, since Google's data is patchy). Holidays aren't accounted for.
 */
export function isOpenAt(hours: OpeningHours | undefined, whenAt: string): boolean | undefined {
  const w = parseWhen(whenAt);
  if (!w || !hours?.periods?.length) return undefined;

  const WEEK = 7 * 1440;
  const t = w.day * 1440 + w.minutes;
  for (const p of hours.periods) {
    if (!p.open) continue;
    if (!p.close) return true; // Google's way of saying "open 24 hours"
    const o = p.open.day * 1440 + p.open.hour * 60 + p.open.minute;
    let c = p.close.day * 1440 + p.close.hour * 60 + p.close.minute;
    if (c <= o) c += WEEK; // closes after midnight, past the end of the week
    if ((t >= o && t < c) || (t + WEEK >= o && t + WEEK < c)) return true;
  }
  return false;
}

/** The place's hours for the chosen day, e.g. "Saturday: 11:00 AM – 9:00 PM". */
export function hoursFor(hours: OpeningHours | undefined, whenAt: string): string | undefined {
  const w = parseWhen(whenAt);
  return w ? hours?.weekdayDescriptions?.[(w.day + 6) % 7] : undefined;
}

/** "Sat, Nov 28, 7:30 PM" */
export function formatWhen(whenAt: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(whenAt);
  if (!m) return whenAt;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  return new Date(y, mo - 1, d, h, mi).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
