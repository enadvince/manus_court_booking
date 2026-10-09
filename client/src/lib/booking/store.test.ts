import { beforeEach, describe, expect, it } from "vitest";
import { getAvailability } from "./availability";
import { COURTS, RULES } from "./rules";
import {
  bookingsFor,
  cancelBooking,
  createBooking,
  rescheduleBooking,
  seededBookings,
  setStoreLatency,
  SlotTakenError,
  type NewBooking,
} from "./store";

// Friday 9 October 2026, 10:30 AM in Manila.
const NOW = new Date("2026-10-09T02:30:00Z");

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: key => data.get(key) ?? null,
    key: index => [...data.keys()][index] ?? null,
    removeItem: key => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

beforeEach(() => {
  setStoreLatency(0);
  Object.assign(globalThis, {
    window: {
      localStorage: memoryStorage(),
      dispatchEvent: () => true,
    },
  });
});

/** A date and start where every court is open in the seeded schedule. */
function openSlot(duration = 60) {
  for (let offset = 1; offset < 14; offset++) {
    const date = `2026-10-${String(9 + offset).padStart(2, "0")}`;
    const slot = getAvailability(
      date,
      duration,
      COURTS,
      seededBookings(date),
      RULES,
      NOW
    ).find(item => item.freeCourtIds.length === COURTS.length);
    if (slot) return { date, start: slot.start };
  }
  throw new Error("no fully open slot in the seeded schedule");
}

const request = (overrides: Partial<NewBooking> = {}): NewBooking => ({
  ...openSlot(overrides.duration ?? 60),
  duration: 60,
  courtId: null,
  name: "Alex dela Cruz",
  mobile: "+639171234567",
  email: "alex@example.com",
  notes: "",
  payment: "cash",
  ...overrides,
});

describe("booking store integrity", () => {
  it("auto-assigns the lowest free court", async () => {
    const booking = await createBooking(request(), NOW);
    expect(booking.courtId).toBe("court-01");
    expect(booking.ref).toMatch(/^BL-\d{6}-[A-Z2-9]{4}$/);
    expect(bookingsFor(booking.date)).toContainEqual(
      expect.objectContaining({ id: booking.id })
    );
  });

  it("rejects an overlapping booking on the same court", async () => {
    const first = await createBooking(
      request({ courtId: "court-02", duration: 120 }),
      NOW
    );
    // Starts an hour into the first booking.
    await expect(
      createBooking(
        request({
          date: first.date,
          start: first.start + 60,
          courtId: "court-02",
        }),
        NOW
      )
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("fills every court, then refuses the next booking", async () => {
    const slot = request();
    for (let i = 0; i < COURTS.length; i++) {
      await createBooking(slot, NOW);
    }
    const courts = bookingsFor(slot.date)
      .filter(item => item.start === slot.start && "ref" in item)
      .map(item => item.courtId)
      .sort();
    expect(courts).toEqual(COURTS.map(court => court.id));
    await expect(createBooking(slot, NOW)).rejects.toBeInstanceOf(
      SlotTakenError
    );
  });

  it("rejects past, out-of-hours and off-grid requests", async () => {
    const today = "2026-10-09";
    for (const bad of [
      { date: today, start: 9 * 60 },
      { date: "2026-10-12", start: 21 * 60, duration: 120 },
      { date: "2026-10-12", start: 5 * 60 },
      { date: "2026-10-12", start: 9 * 60 + 30 },
      { date: "2026-12-01", start: 9 * 60 },
    ]) {
      await expect(createBooking(request(bad), NOW)).rejects.toBeInstanceOf(
        SlotTakenError
      );
    }
  });

  it("frees the court when a booking is cancelled", async () => {
    const booking = await createBooking(request({ courtId: "court-03" }), NOW);
    await cancelBooking(booking.id);
    const again = await createBooking(
      request({
        date: booking.date,
        start: booking.start,
        courtId: "court-03",
      }),
      NOW
    );
    expect(again.courtId).toBe("court-03");
  });

  it("can move a booking onto a range overlapping its own slot", async () => {
    const booking = await createBooking(
      request({ courtId: "court-04", duration: 60 }),
      NOW
    );
    const moved = await rescheduleBooking(
      booking.id,
      {
        date: booking.date,
        start: booking.start,
        duration: 60,
        courtId: "court-04",
      },
      NOW
    );
    expect(moved.courtId).toBe("court-04");
  });

  it("seeds the same schedule for a day every time", () => {
    expect(seededBookings("2026-10-15")).toEqual(seededBookings("2026-10-15"));
  });
});
