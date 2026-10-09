import type { Court, Rules } from "./rules";
import { addDays, formatTime, manilaNow } from "./time";

/** The parts of a booking that decide whether a court is free. */
export type BookedSlot = {
  courtId: string;
  date: string;
  start: number;
  duration: number;
  status: "confirmed" | "cancelled";
};

export type SlotStatus = "open" | "full" | "past" | "closing";

export type SlotAvailability = {
  start: number;
  end: number;
  status: SlotStatus;
  /** Courts free for the whole duration, lowest court first. */
  freeCourtIds: string[];
};

export function overlaps(
  a: { start: number; duration: number },
  b: { start: number; duration: number }
): boolean {
  return a.start < b.start + b.duration && b.start < a.start + a.duration;
}

/** Courts free on `date` for the whole of [start, start + duration). */
export function freeCourts(
  date: string,
  start: number,
  duration: number,
  courts: Court[],
  bookings: BookedSlot[]
): string[] {
  const candidate = { start, duration };
  return courts
    .filter(
      court =>
        !bookings.some(
          booking =>
            booking.status !== "cancelled" &&
            booking.courtId === court.id &&
            booking.date === date &&
            overlaps(booking, candidate)
        )
    )
    .map(court => court.id);
}

/**
 * Every start time on the grid for one day, with the courts free for the
 * entire duration. Start times that are past, run beyond closing or have no
 * free court are still returned so the UI can show them disabled.
 */
export function getAvailability(
  date: string,
  durationMins: number,
  courts: Court[],
  bookings: BookedSlot[],
  rules: Rules,
  now: Date = new Date()
): SlotAvailability[] {
  const today = manilaNow(now);
  const slots: SlotAvailability[] = [];
  for (
    let start = rules.openMins;
    start < rules.closeMins;
    start += rules.stepMins
  ) {
    const end = start + durationMins;
    const isPast =
      date < today.date || (date === today.date && start <= today.minutes);
    const freeCourtIds =
      isPast || end > rules.closeMins
        ? []
        : freeCourts(date, start, durationMins, courts, bookings);
    const status: SlotStatus = isPast
      ? "past"
      : end > rules.closeMins
        ? "closing"
        : freeCourtIds.length
          ? "open"
          : "full";
    slots.push({ start, end, status, freeCourtIds });
  }
  return slots;
}

export function slotReason(slot: SlotAvailability, rules: Rules): string {
  switch (slot.status) {
    case "past":
      return "This time has passed";
    case "closing":
      return `Runs past closing at ${formatTime(rules.closeMins)}`;
    case "full":
      return "All courts are booked";
    default:
      return "";
  }
}

export type Alternative = { date: string; start: number; duration: number };

/**
 * Up to `limit` bookable options near what the player wanted: the same day
 * at a shorter duration first, then the following days at the same duration,
 * each time picking the start closest to `preferredStart`.
 */
export function findAlternatives({
  date,
  duration,
  preferredStart,
  courts,
  bookingsFor,
  rules,
  now = new Date(),
  limit = 3,
  exclude,
}: {
  date: string;
  duration: number;
  preferredStart: number | null;
  courts: Court[];
  bookingsFor: (date: string) => BookedSlot[];
  rules: Rules;
  now?: Date;
  limit?: number;
  /** An option to skip, such as the slot that was just taken. */
  exclude?: Alternative;
}): Alternative[] {
  const results: Alternative[] = [];
  const target = preferredStart ?? 18 * 60;
  const closest = (day: string, length: number) =>
    getAvailability(day, length, courts, bookingsFor(day), rules, now)
      .filter(slot => slot.status === "open")
      .filter(
        slot =>
          !(
            exclude &&
            exclude.date === day &&
            exclude.duration === length &&
            exclude.start === slot.start
          )
      )
      .sort(
        (a, b) =>
          Math.abs(a.start - target) - Math.abs(b.start - target) ||
          a.start - b.start
      );

  const shorter = rules.durations.filter(length => length < duration);
  for (const length of [...shorter].reverse()) {
    const [best] = closest(date, length);
    if (best) results.push({ date, start: best.start, duration: length });
    if (results.length >= limit) return results;
  }

  // The same day at the same duration (useful when one slot was just taken).
  for (const slot of closest(date, duration)) {
    results.push({ date, start: slot.start, duration });
    if (results.length >= limit) return results;
    break;
  }

  const today = manilaNow(now).date;
  const lastDay = addDays(today, rules.bookingWindowDays - 1);
  for (let offset = 1; offset < rules.bookingWindowDays; offset++) {
    const day = addDays(date, offset);
    if (day > lastDay) break;
    if (day < today) continue;
    const [best] = closest(day, duration);
    if (best) results.push({ date: day, start: best.start, duration });
    if (results.length >= limit) break;
  }
  return results;
}
