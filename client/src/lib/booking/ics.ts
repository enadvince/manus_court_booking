import { contact } from "../siteContent";
import { COURTS, RULES } from "./rules";
import type { Booking } from "./store";

const pad = (value: number) => String(value).padStart(2, "0");

/** A Manila wall-clock time as a UTC iCalendar stamp (Manila is UTC+8, no DST). */
export function toIcsUtc(date: string, minutes: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, 0, minutes - 8 * 60));
  return `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}T${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}00Z`;
}

const escapeText = (text: string) =>
  text.replace(/[\\;,]/g, match => `\\${match}`).replace(/\n/g, "\\n");

export function courtName(courtId: string): string {
  return COURTS.find(court => court.id === courtId)?.name ?? courtId;
}

export function buildIcs(booking: Booking, stamp: Date = new Date()): string {
  const now = stamp
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Baseline Pickle Club//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.ref}@baseline.ph`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsUtc(booking.date, booking.start)}`,
    `DTEND:${toIcsUtc(booking.date, booking.start + booking.duration)}`,
    `SUMMARY:${escapeText(`Pickleball · ${courtName(booking.courtId)} · Baseline`)}`,
    `LOCATION:${escapeText(contact.address)}`,
    `DESCRIPTION:${escapeText(`Booking ${booking.ref}. Please allow ${RULES.changeoverMins} minutes for court changeover.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Google Calendar link with the same event. */
export function googleCalendarUrl(booking: Booking): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Pickleball · ${courtName(booking.courtId)} · Baseline`,
    details: `Booking ${booking.ref}`,
    location: contact.address,
    dates: `${toIcsUtc(booking.date, booking.start)}/${toIcsUtc(booking.date, booking.start + booking.duration)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
