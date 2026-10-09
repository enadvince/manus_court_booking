// All booking dates and times are Manila local time. Manila has no daylight
// saving, so a calendar day is an ISO string ("2026-10-09") and a time of day
// is minutes after midnight (420 = 7:00 AM).

export const CLUB_TIME_ZONE = "Asia/Manila";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLUB_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The Manila calendar day and minute of the day for an instant. */
export function manilaNow(now: Date = new Date()): {
  date: string;
  minutes: number;
} {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(now).map(part => [part.type, part.value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

export function addDays(isoDay: string, days: number): string {
  const date = new Date(`${isoDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 0 = Sunday ... 6 = Saturday. */
export function dayOfWeek(isoDay: string): number {
  return new Date(`${isoDay}T00:00:00Z`).getUTCDay();
}

export function isIsoDay(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

/** "7:00 AM", "12:30 PM". */
export function formatTime(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const suffix = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

/** "7:00 to 8:30 AM", "11:00 AM to 1:00 PM". */
export function formatTimeRange(start: number, end: number): string {
  const from = formatTime(start);
  const to = formatTime(end);
  const sameHalf = from.slice(-2) === to.slice(-2);
  return `${sameHalf ? from.slice(0, -3) : from} to ${to}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return `${hours} hr${hours === 1 ? "" : "s"}`;
  return hours ? `${hours} hr ${rest} min` : `${rest} min`;
}

const longDay = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortWeekday = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  timeZone: "UTC",
});
const shortDay = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const utc = (isoDay: string) => new Date(`${isoDay}T00:00:00Z`);

/** "Friday, 9 October 2026". */
export const formatLongDay = (isoDay: string) => longDay.format(utc(isoDay));
/** "Fri". */
export const formatWeekday = (isoDay: string) =>
  shortWeekday.format(utc(isoDay));
/** "Fri, 9 Oct". */
export const formatShortDay = (isoDay: string) => shortDay.format(utc(isoDay));

/** "HH:MM" (24 hour, used in URLs) to minutes, or null. */
export function parseClock(value: string | null): number | null {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  return minutes < 24 * 60 ? minutes : null;
}

export function toClock(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
