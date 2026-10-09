import { dayOfWeek } from "./time";

export type Court = { id: string; name: string; short: string; meta: string };

export const COURTS: Court[] = [1, 2, 3, 4].map(number => ({
  id: `court-0${number}`,
  name: `Court 0${number}`,
  short: `0${number}`,
  meta: "Indoor · Tournament surface",
}));

export type Rules = {
  /** Opening and closing time, in minutes after midnight. */
  openMins: number;
  closeMins: number;
  /** Start times fall on this grid. */
  stepMins: number;
  durations: readonly number[];
  /** Days ahead players can book, today included. */
  bookingWindowDays: number;
  /**
   * Changeover time players are told to expect. It is communicated, not
   * scheduled: back-to-back sessions still start on the hour.
   */
  changeoverMins: number;
};

export const RULES: Rules = {
  openMins: 6 * 60,
  closeMins: 22 * 60,
  stepMins: 60,
  durations: [60, 90, 120],
  bookingWindowDays: 14,
  changeoverMins: 5,
};

export const PRICING = {
  offPeakPerHour: 450,
  peakPerHour: 600,
  /** Weekday evenings; weekends are peak all day. */
  weekdayPeakStart: 18 * 60,
  weekdayPeakEnd: 21 * 60,
} as const;

export function isPeakMinute(isoDay: string, minute: number): boolean {
  const day = dayOfWeek(isoDay);
  if (day === 0 || day === 6) return true;
  return minute >= PRICING.weekdayPeakStart && minute < PRICING.weekdayPeakEnd;
}

export type Price = { total: number; peakMins: number; offPeakMins: number };

/** Court fee for one booking, charged per half hour at the rate in force. */
export function getPrice(
  isoDay: string,
  startMins: number,
  durationMins: number
): Price {
  let peakMins = 0;
  for (
    let minute = startMins;
    minute < startMins + durationMins;
    minute += 30
  ) {
    if (isPeakMinute(isoDay, minute)) peakMins += 30;
  }
  const offPeakMins = durationMins - peakMins;
  const total =
    (peakMins / 60) * PRICING.peakPerHour +
    (offPeakMins / 60) * PRICING.offPeakPerHour;
  return { total, peakMins, offPeakMins };
}

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const formatPeso = (amount: number) => peso.format(amount);
