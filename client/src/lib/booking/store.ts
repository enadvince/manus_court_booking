import { freeCourts, type BookedSlot } from "./availability";
import { COURTS, getPrice, RULES } from "./rules";
import { addDays, manilaNow } from "./time";

/**
 * Demo booking store. Until a database is connected, bookings made on this
 * device live in localStorage and the rest of the club's schedule is seeded
 * deterministically per day. Every write re-checks availability, so the UI
 * can never confirm an overlapping booking. Swap these functions for API
 * calls (see supabase/migrations) without touching the UI.
 */

export type PaymentMethod = "cash" | "qr";
export type PaymentStatus = "due" | "submitted" | "verified" | "rejected";

export type Booking = BookedSlot & {
  id: string;
  ref: string;
  name: string;
  mobile: string;
  email: string;
  notes: string;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Downscaled payment screenshot (data URL) for the host to check. */
  proof?: string;
  total: number;
  createdAt: string;
};

export type SlotRequest = {
  date: string;
  start: number;
  duration: number;
  /** null lets the club assign the lowest free court. */
  courtId: string | null;
};

export type NewBooking = SlotRequest &
  Pick<Booking, "name" | "mobile" | "email" | "notes" | "payment" | "proof">;

export class SlotTakenError extends Error {
  constructor() {
    super("That time was just booked by someone else.");
    this.name = "SlotTakenError";
  }
}

export const STORE_KEY = "baseline-bookings";
const CHANGE_EVENT = "baseline:bookings";
let latencyMs = 450;

/** Tests set this to 0; the UI keeps a short delay so loading states are real. */
export function setStoreLatency(ms: number) {
  latencyMs = ms;
}

const wait = () =>
  latencyMs ? new Promise(resolve => setTimeout(resolve, latencyMs)) : null;

function readAll(): Booking[] {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORE_KEY) ?? "[]"
    ) as unknown;
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

function writeAll(bookings: Booking[]) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(bookings));
  } catch {
    throw new Error(
      "We couldn't save your booking on this device. Check that site data is allowed and try again."
    );
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Calls `listener` when bookings change in this tab or another one. */
export function subscribeToBookings(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORE_KEY) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Other players' bookings: stable for a given day, busier in the evening. */
export function seededBookings(date: string): BookedSlot[] {
  const tournamentDay = hash(`tournament:${date}`) % 23 === 0;
  const slots: BookedSlot[] = [];
  for (const court of COURTS) {
    if (tournamentDay) {
      slots.push({
        courtId: court.id,
        date,
        start: RULES.openMins,
        duration: RULES.closeMins - RULES.openMins,
        status: "confirmed",
      });
      continue;
    }
    for (let start = RULES.openMins; start < RULES.closeMins; ) {
      const roll = hash(`${date}:${court.id}:${start}`) % 100;
      const busyChance = start >= 17 * 60 ? 55 : start < 9 * 60 ? 35 : 22;
      if (roll < busyChance) {
        const duration =
          roll % 3 === 0 && start + 120 <= RULES.closeMins ? 120 : 60;
        slots.push({
          courtId: court.id,
          date,
          start,
          duration,
          status: "confirmed",
        });
        start += duration;
      } else {
        start += RULES.stepMins;
      }
    }
  }
  return slots;
}

/** Everything that occupies a court on `date`. Synchronous; used for checks. */
export function bookingsFor(date: string): BookedSlot[] {
  return [
    ...seededBookings(date),
    ...readAll().filter(booking => booking.date === date),
  ];
}

export async function fetchBookings(date: string): Promise<BookedSlot[]> {
  await wait();
  return bookingsFor(date);
}

export function myBookings(): Booking[] {
  return readAll().sort(
    (a, b) => a.date.localeCompare(b.date) || a.start - b.start
  );
}

export function findBooking(ref: string): Booking | undefined {
  return readAll().find(booking => booking.ref === ref);
}

/**
 * Picks the court for a request, or throws SlotTakenError. `ignoreId` lets a
 * booking be moved onto a range that overlaps its own current slot.
 */
function assignCourt(
  request: SlotRequest,
  now: Date,
  ignoreId?: string
): string {
  const today = manilaNow(now);
  const lastDay = addDays(today.date, RULES.bookingWindowDays - 1);
  const end = request.start + request.duration;
  if (
    !RULES.durations.includes(request.duration) ||
    request.start < RULES.openMins ||
    end > RULES.closeMins ||
    (request.start - RULES.openMins) % RULES.stepMins !== 0 ||
    request.date > lastDay ||
    request.date < today.date ||
    (request.date === today.date && request.start <= today.minutes)
  ) {
    throw new SlotTakenError();
  }
  const others = [
    ...seededBookings(request.date),
    ...readAll().filter(
      booking => booking.date === request.date && booking.id !== ignoreId
    ),
  ];
  const free = freeCourts(
    request.date,
    request.start,
    request.duration,
    COURTS,
    others
  );
  const courtId = request.courtId ?? free[0];
  if (!courtId || !free.includes(courtId)) throw new SlotTakenError();
  return courtId;
}

function newRef(date: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from(
    crypto.getRandomValues(new Uint8Array(4)),
    byte => alphabet[byte % alphabet.length]
  ).join("");
  return `BL-${date.slice(2).replaceAll("-", "")}-${random}`;
}

export async function createBooking(
  input: NewBooking,
  now: Date = new Date()
): Promise<Booking> {
  await wait();
  // Re-read storage at the moment of writing: another tab may have booked.
  const courtId = assignCourt(input, now);
  const booking: Booking = {
    id: crypto.randomUUID(),
    ref: newRef(input.date),
    courtId,
    date: input.date,
    start: input.start,
    duration: input.duration,
    status: "confirmed",
    name: input.name.trim(),
    mobile: input.mobile,
    email: input.email.trim(),
    notes: input.notes.trim(),
    payment: input.payment,
    paymentStatus: input.payment === "qr" ? "submitted" : "due",
    ...(input.proof ? { proof: input.proof } : {}),
    total: getPrice(input.date, input.start, input.duration).total,
    createdAt: now.toISOString(),
  };
  writeAll([...readAll(), booking]);
  return booking;
}

function update(id: string, change: (booking: Booking) => Booking): Booking {
  const all = readAll();
  const index = all.findIndex(booking => booking.id === id);
  if (index === -1) throw new Error("We couldn't find that booking.");
  const next = change(all[index]);
  all[index] = next;
  writeAll(all);
  return next;
}

export async function cancelBooking(id: string): Promise<Booking> {
  await wait();
  return update(id, booking => ({ ...booking, status: "cancelled" }));
}

export async function rescheduleBooking(
  id: string,
  request: SlotRequest,
  now: Date = new Date()
): Promise<Booking> {
  await wait();
  const courtId = assignCourt(request, now, id);
  return update(id, booking => ({
    ...booking,
    courtId,
    date: request.date,
    start: request.start,
    duration: request.duration,
    total: getPrice(request.date, request.start, request.duration).total,
  }));
}

export function setPaymentStatus(id: string, paymentStatus: PaymentStatus) {
  return update(id, booking => ({ ...booking, paymentStatus }));
}
