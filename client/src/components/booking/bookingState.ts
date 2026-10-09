import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { subscribeToBookings } from "@/lib/booking/store";
import type { PlayerDetails } from "@/lib/booking/validation";

/** Booking selection kept in the URL so refresh, back and shared links work. */
export type BookingParams = {
  date: string | null;
  dur: string | null;
  time: string | null;
  court: string | null;
  /** A confirmed booking to show. */
  ref: string | null;
  /** A booking being moved to a new time. */
  reschedule: string | null;
};

const KEYS: (keyof BookingParams)[] = [
  "date",
  "dur",
  "time",
  "court",
  "ref",
  "reschedule",
];

function readParams(): BookingParams {
  const search = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    KEYS.map(key => [key, search.get(key)])
  ) as BookingParams;
}

export function bookingUrl(params: Partial<BookingParams>): string {
  const search = new URLSearchParams({ view: "book" });
  for (const key of KEYS) {
    const value = params[key];
    if (value) search.set(key, value);
  }
  return `/?${search.toString()}`;
}

/** Opens the booking page at `params` from anywhere on the site. */
export function openBooking(params: Partial<BookingParams>) {
  window.history.pushState({}, "", bookingUrl(params));
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useBookingParams() {
  const [params, setState] = useState(readParams);
  useEffect(() => {
    const onPopState = () => setState(readParams());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const setParams = useCallback(
    (next: Partial<BookingParams>, mode: "replace" | "push" = "replace") => {
      setState(current => {
        const merged = { ...current, ...next };
        const url = bookingUrl(merged);
        if (mode === "push") window.history.pushState({}, "", url);
        else window.history.replaceState({}, "", url);
        return merged;
      });
    },
    []
  );
  return [params, setParams] as const;
}

/** Re-renders when bookings change here or in another tab. */
export function useBookingsVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeToBookings(() => setVersion(v => v + 1)), []);
  return version;
}

/** The current time, refreshed every minute so past slots close on their own. */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

const DRAFT_KEY = "baseline-booking-draft";
export const EMPTY_DETAILS: PlayerDetails = {
  name: "",
  mobile: "",
  email: "",
  notes: "",
};

export function readDraft(): PlayerDetails {
  try {
    const saved = JSON.parse(
      window.sessionStorage.getItem(DRAFT_KEY) ?? "null"
    ) as Partial<PlayerDetails> | null;
    return { ...EMPTY_DETAILS, ...saved };
  } catch {
    return EMPTY_DETAILS;
  }
}

export function writeDraft(details: PlayerDetails | null) {
  try {
    if (details)
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* the draft simply isn't kept */
  }
}

const STEP: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/**
 * Arrow, Home and End keys for a role="radiogroup": focus moves between the
 * radios and selects the one it lands on, unless that radio is aria-disabled
 * (it still takes focus so its reason can be read).
 */
export function onRadioGroupKeyDown(event: KeyboardEvent<HTMLElement>) {
  const radios = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')
  );
  if (!radios.length) return;
  const index = radios.indexOf(document.activeElement as HTMLElement);
  let next: number;
  if (event.key in STEP)
    next =
      (Math.max(index, 0) + STEP[event.key] + radios.length) % radios.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = radios.length - 1;
  else return;
  event.preventDefault();
  const target = radios[next];
  target.focus();
  target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  if (target.getAttribute("aria-disabled") !== "true") target.click();
}

/** The radio that should be in the tab order: the checked one, else the first. */
export function rovingTabIndex(
  isChecked: boolean,
  isFirst: boolean,
  anyChecked: boolean
) {
  return isChecked || (!anyChecked && isFirst) ? 0 : -1;
}
