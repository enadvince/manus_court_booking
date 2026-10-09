import { describe, expect, it } from "vitest";
import {
  findAlternatives,
  getAvailability,
  type BookedSlot,
} from "./availability";
import { buildIcs, toIcsUtc } from "./ics";
import { gamesPerPlayer, recommendedCap } from "./openPlay";
import { COURTS, formatPeso, getPrice, RULES } from "./rules";
import { formatTime, formatTimeRange, manilaNow } from "./time";
import { normalizePhMobile, validateDetails } from "./validation";

// Friday 9 October 2026, 10:30 AM in Manila (02:30 UTC).
const NOW = new Date("2026-10-09T02:30:00Z");
const TODAY = "2026-10-09";
const TOMORROW = "2026-10-10";

const booked = (
  courtId: string,
  start: number,
  duration: number,
  date = TOMORROW,
  status: BookedSlot["status"] = "confirmed"
): BookedSlot => ({ courtId, date, start, duration, status });

const slotAt = (slots: ReturnType<typeof getAvailability>, hour: number) =>
  slots.find(slot => slot.start === hour * 60)!;

describe("manilaNow", () => {
  it("reads the Manila calendar day, not the UTC one", () => {
    // 23:30 UTC on 9 Oct is 7:30 AM on 10 Oct in Manila.
    expect(manilaNow(new Date("2026-10-09T23:30:00Z"))).toEqual({
      date: "2026-10-10",
      minutes: 7 * 60 + 30,
    });
  });
});

describe("getAvailability", () => {
  it("returns one start per hour from 6 AM to 9 PM", () => {
    const slots = getAvailability(TOMORROW, 60, COURTS, [], RULES, NOW);
    expect(slots).toHaveLength(16);
    expect(slots[0].start).toBe(6 * 60);
    expect(slots.at(-1)!.start).toBe(21 * 60);
    expect(slots.every(slot => slot.freeCourtIds.length === 4)).toBe(true);
  });

  it("never offers start times that have passed today", () => {
    const slots = getAvailability(TODAY, 60, COURTS, [], RULES, NOW);
    expect(slotAt(slots, 10).status).toBe("past");
    expect(slotAt(slots, 10).freeCourtIds).toEqual([]);
    expect(slotAt(slots, 11).status).toBe("open");
  });

  it("treats the exact current minute as past", () => {
    const tenSharp = new Date("2026-10-09T02:00:00Z");
    const slots = getAvailability(TODAY, 60, COURTS, [], RULES, tenSharp);
    expect(slotAt(slots, 10).status).toBe("past");
  });

  it("handles the Manila day boundary", () => {
    // 00:30 on 10 Oct in Manila, still 9 Oct in UTC.
    const justAfterMidnight = new Date("2026-10-09T16:30:00Z");
    const yesterday = getAvailability(
      TODAY,
      60,
      COURTS,
      [],
      RULES,
      justAfterMidnight
    );
    const today = getAvailability(
      TOMORROW,
      60,
      COURTS,
      [],
      RULES,
      justAfterMidnight
    );
    expect(yesterday.every(slot => slot.status === "past")).toBe(true);
    expect(today.every(slot => slot.status !== "past")).toBe(true);
  });

  it("allows a booking that ends exactly at closing, not one past it", () => {
    const twoHours = getAvailability(TOMORROW, 120, COURTS, [], RULES, NOW);
    expect(slotAt(twoHours, 20).status).toBe("open");
    expect(slotAt(twoHours, 20).end).toBe(RULES.closeMins);
    expect(slotAt(twoHours, 21).status).toBe("closing");
    const ninety = getAvailability(TOMORROW, 90, COURTS, [], RULES, NOW);
    expect(slotAt(ninety, 21).status).toBe("closing");
  });

  it("marks a fully booked day as full", () => {
    const allDay = COURTS.map(court =>
      booked(court.id, RULES.openMins, RULES.closeMins - RULES.openMins)
    );
    const slots = getAvailability(TOMORROW, 60, COURTS, allDay, RULES, NOW);
    expect(slots.every(slot => slot.status === "full")).toBe(true);
  });

  it("only lists courts free for the entire duration", () => {
    // Court 01 is booked 9:00 to 10:00.
    const bookings = [booked("court-01", 9 * 60, 60)];
    const twoHours = getAvailability(
      TOMORROW,
      120,
      COURTS,
      bookings,
      RULES,
      NOW
    );
    // 8:00 to 10:00 overlaps the 9:00 booking for its second hour.
    expect(slotAt(twoHours, 8).freeCourtIds).toEqual([
      "court-02",
      "court-03",
      "court-04",
    ]);
    // 10:00 starts as the booking ends: back to back is allowed.
    expect(slotAt(twoHours, 10).freeCourtIds).toHaveLength(4);
    // 7:00 to 9:00 ends as the booking starts.
    expect(slotAt(twoHours, 7).freeCourtIds).toHaveLength(4);
  });

  it("ignores cancelled bookings and other days", () => {
    const bookings = [
      booked("court-01", 9 * 60, 60, TOMORROW, "cancelled"),
      booked("court-02", 9 * 60, 60, "2026-10-11"),
    ];
    const slots = getAvailability(TOMORROW, 60, COURTS, bookings, RULES, NOW);
    expect(slotAt(slots, 9).freeCourtIds).toHaveLength(4);
  });
});

describe("findAlternatives", () => {
  it("offers shorter durations the same day, then the next days", () => {
    // Tomorrow every court is busy every other hour (6 AM, 8 AM ... 8 PM),
    // so neither 2 hours nor 90 minutes fit anywhere; only 1 hour slots do.
    const pattern = (date: string) =>
      COURTS.flatMap(court =>
        Array.from({ length: 8 }, (_, i) =>
          booked(court.id, RULES.openMins + i * 120, 60, date)
        )
      );
    const options = findAlternatives({
      date: TOMORROW,
      duration: 120,
      preferredStart: 18 * 60,
      courts: COURTS,
      bookingsFor: date => (date === TOMORROW ? pattern(date) : []),
      rules: RULES,
      now: NOW,
    });
    expect(options).toEqual([
      { date: TOMORROW, start: 17 * 60, duration: 60 },
      { date: "2026-10-11", start: 18 * 60, duration: 120 },
      { date: "2026-10-12", start: 18 * 60, duration: 120 },
    ]);
  });
});

describe("getPrice", () => {
  it("charges off-peak on a weekday morning", () => {
    expect(getPrice("2026-10-08", 9 * 60, 60)).toEqual({
      total: 450,
      peakMins: 0,
      offPeakMins: 60,
    });
  });

  it("charges peak all day on weekends", () => {
    expect(getPrice("2026-10-10", 9 * 60, 120).total).toBe(1200);
  });

  it("splits a booking that spans the weekday peak boundary", () => {
    // Thursday 5:00 to 6:30 PM: one off-peak hour, half a peak hour.
    expect(getPrice("2026-10-08", 17 * 60, 90)).toEqual({
      total: 450 + 300,
      peakMins: 30,
      offPeakMins: 60,
    });
    // 8:00 to 10:00 PM: peak ends at 9 PM.
    expect(getPrice("2026-10-08", 20 * 60, 120).total).toBe(600 + 450);
  });

  it("formats pesos", () => {
    expect(formatPeso(1050)).toMatch(/^₱1,050$/);
  });
});

describe("time formatting", () => {
  it("uses AM and PM", () => {
    expect(formatTime(6 * 60)).toBe("6:00 AM");
    expect(formatTime(12 * 60)).toBe("12:00 PM");
    expect(formatTime(21 * 60 + 30)).toBe("9:30 PM");
    expect(formatTimeRange(7 * 60, 8 * 60 + 30)).toBe("7:00 to 8:30 AM");
    expect(formatTimeRange(11 * 60, 13 * 60)).toBe("11:00 AM to 1:00 PM");
  });
});

describe("player details", () => {
  it("accepts common PH mobile formats", () => {
    for (const value of [
      "09171234567",
      "0917 123 4567",
      "+63 917-123-4567",
      "639171234567",
      "9171234567",
    ]) {
      expect(normalizePhMobile(value)).toBe("+639171234567");
    }
    expect(normalizePhMobile("0817 123 4567")).toBeNull();
    expect(normalizePhMobile("0917 123 456")).toBeNull();
  });

  it("reports every invalid field", () => {
    expect(
      validateDetails({ name: "A", mobile: "123", email: "x@", notes: "" })
    ).toEqual({
      name: expect.any(String),
      mobile: expect.any(String),
      email: expect.any(String),
    });
    expect(
      validateDetails({
        name: "Alex dela Cruz",
        mobile: "0917 123 4567",
        email: "alex@example.com",
        notes: "",
      })
    ).toEqual({});
  });
});

describe("calendar export", () => {
  it("converts Manila wall time to UTC", () => {
    expect(toIcsUtc("2026-10-10", 7 * 60)).toBe("20261009T230000Z");
    expect(toIcsUtc("2026-10-10", 18 * 60)).toBe("20261010T100000Z");
  });

  it("builds a valid single-event calendar", () => {
    const ics = buildIcs(
      {
        id: "1",
        ref: "BL-261010-ABCD",
        courtId: "court-02",
        date: "2026-10-10",
        start: 18 * 60,
        duration: 90,
        status: "confirmed",
        name: "Alex",
        mobile: "+639171234567",
        email: "alex@example.com",
        notes: "",
        payment: "cash",
        paymentStatus: "due",
        total: 900,
        createdAt: "",
      },
      new Date("2026-10-09T02:30:00Z")
    );
    expect(ics).toContain("DTSTART:20261010T100000Z\r\n");
    expect(ics).toContain("DTEND:20261010T113000Z\r\n");
    expect(ics).toContain("UID:BL-261010-ABCD@baseline.ph");
    expect(ics).toContain("SUMMARY:Pickleball · Court 02 · Baseline");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  });
});

describe("open play caps", () => {
  it("recommends more players for longer sessions", () => {
    expect(recommendedCap(1)).toBe(6);
    expect(recommendedCap(2)).toBe(8);
    expect(recommendedCap(3)).toBe(12);
    expect(gamesPerPlayer(8, 2)).toBe(4);
    expect(gamesPerPlayer(16, 2)).toBe(2);
  });
});
