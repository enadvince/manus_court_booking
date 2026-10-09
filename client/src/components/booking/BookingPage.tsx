import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Info,
  RotateCcw,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/site/Dialogs";
import { useIsMobile } from "@/hooks/useMobile";
import type { Member } from "@/lib/auth";
import {
  findAlternatives,
  getAvailability,
  slotReason,
  type Alternative,
  type BookedSlot,
  type SlotAvailability,
} from "@/lib/booking/availability";
import { courtName } from "@/lib/booking/ics";
import {
  COURTS,
  formatPeso,
  getPrice,
  isPeakMinute,
  PRICING,
  RULES,
} from "@/lib/booking/rules";
import {
  bookingsFor,
  createBooking,
  fetchBookings,
  findBooking,
  rescheduleBooking,
  SlotTakenError,
  type Booking,
  type PaymentMethod,
} from "@/lib/booking/store";
import {
  addDays,
  formatDuration,
  formatLongDay,
  formatShortDay,
  formatTime,
  formatTimeRange,
  formatWeekday,
  isIsoDay,
  manilaNow,
  parseClock,
  toClock,
} from "@/lib/booking/time";
import {
  normalizePhMobile,
  type PlayerDetails,
} from "@/lib/booking/validation";
import { BookingReceipt, isUpcoming } from "./BookingReceipt";
import {
  EMPTY_DETAILS,
  onRadioGroupKeyDown,
  readDraft,
  rovingTabIndex,
  useBookingParams,
  useBookingsVersion,
  useNow,
  writeDraft,
} from "./bookingState";
import { DetailsForm, PaymentPicker } from "./Checkout";

type Step = "select" | "details" | "review";

// Rarely needed on first paint, so they load on first use.
const MonthCalendar = lazy(() =>
  import("@/components/ui/calendar").then(m => ({ default: m.Calendar }))
);
const BookingSheet = lazy(() => import("./BookingSheet"));

const GROUPS = [
  { label: "Morning", test: (start: number) => start < 12 * 60 },
  {
    label: "Afternoon",
    test: (start: number) => start >= 12 * 60 && start < 17 * 60,
  },
  { label: "Evening", test: (start: number) => start >= 17 * 60 },
];

const durationLabel = (minutes: number) =>
  minutes === 90 ? "1.5 hrs" : formatDuration(minutes);

function courtsLeft(count: number) {
  if (count === COURTS.length) return `${count} courts open`;
  return `${count} court${count === 1 ? "" : "s"} left`;
}

/** Local-midnight Date for an ISO day, and back, for the calendar widget. */
const toLocalDate = (isoDay: string) => {
  const [year, month, day] = isoDay.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const fromLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function BookingPage({ member }: { member: Member | null }) {
  const [params, setParams] = useBookingParams();
  const version = useBookingsVersion();
  const now = useNow();
  const isMobile = useIsMobile();

  const today = manilaNow(now);
  const lastDay = addDays(today.date, RULES.bookingWindowDays - 1);
  const firstOpenDay =
    today.minutes >= RULES.closeMins - RULES.stepMins
      ? addDays(today.date, 1)
      : today.date;
  const date =
    isIsoDay(params.date) && params.date >= today.date && params.date <= lastDay
      ? params.date
      : firstOpenDay;
  const duration = RULES.durations.includes(Number(params.dur))
    ? Number(params.dur)
    : RULES.durations[0];
  const start = parseClock(params.time);
  const courtId = COURTS.some(court => court.id === params.court)
    ? params.court
    : null;

  // version is read so lookups refresh when bookings change.
  const confirmed = params.ref ? findBooking(params.ref) : undefined;
  const moving = useMemo(() => {
    const booking = params.reschedule
      ? findBooking(params.reschedule)
      : undefined;
    return booking && isUpcoming(booking, now) ? booking : undefined;
  }, [params.reschedule, version, now]);

  /** A booking being moved shouldn't block its own court. */
  const withoutMoving = (list: BookedSlot[]) =>
    moving
      ? list.filter(item => (item as Partial<Booking>).id !== moving.id)
      : list;

  const [loaded, setLoaded] = useState<{
    date: string;
    bookings: BookedSlot[];
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchBookings(date).then(bookings => {
      if (!cancelled) setLoaded({ date, bookings });
    });
    return () => {
      cancelled = true;
    };
  }, [date]);
  useEffect(() => {
    setLoaded(
      current =>
        current && { date: current.date, bookings: bookingsFor(current.date) }
    );
  }, [version]);

  const bookings =
    loaded?.date === date ? withoutMoving(loaded.bookings) : null;
  const availability = bookings
    ? getAvailability(date, duration, COURTS, bookings, RULES, now)
    : null;
  const selected =
    start === null
      ? undefined
      : availability?.find(slot => slot.start === start);
  const selectionValid =
    selected?.status === "open" &&
    (!courtId || selected.freeCourtIds.includes(courtId));
  const assignedCourt = selectionValid
    ? (courtId ?? selected.freeCourtIds[0])
    : null;
  const price = start !== null ? getPrice(date, start, duration) : null;

  const [step, setStep] = useState<Step>("select");
  const [notice, setNotice] = useState("");
  const [showCourts, setShowCourts] = useState(courtId !== null);
  const [details, setDetails] = useState<PlayerDetails>(() => {
    const draft = readDraft();
    return member && !draft.name && !draft.email
      ? { ...draft, name: member.name, email: member.email }
      : draft;
  });
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [proof, setProof] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const sheetOpen = isMobile && step !== "select";
  // Stays mounted after first use so the sheet can animate closed.
  const [sheetUsed, setSheetUsed] = useState(false);
  useEffect(() => {
    if (sheetOpen) setSheetUsed(true);
  }, [sheetOpen]);

  useEffect(() => writeDraft(details), [details]);

  // A selection that stops being bookable (duration change, another player,
  // time passing) is cleared with a one-line reason, never kept silently.
  useEffect(() => {
    if (
      confirmed ||
      step !== "select" ||
      !availability ||
      start === null ||
      selectionValid
    )
      return;
    if (selected?.status === "open" && courtId) {
      setNotice(
        `${courtName(courtId)} is booked at ${formatTime(start)}, so we'll assign the best free court.`
      );
      setParams({ court: null });
    } else {
      setNotice(
        `${formatTime(start)} isn't free for ${formatDuration(duration)}, so we cleared it. Pick another time.`
      );
      setParams({ time: null });
    }
  }, [
    availability,
    confirmed,
    courtId,
    duration,
    selected,
    selectionValid,
    setParams,
    start,
    step,
  ]);

  // Keep the floating contact button above the mobile booking bar.
  const bar = useRef<HTMLDivElement>(null);
  const showBar = isMobile && !confirmed;
  useEffect(() => {
    const element = bar.current;
    const root = document.documentElement;
    if (!showBar || !element) return;
    const observer = new ResizeObserver(() =>
      root.style.setProperty("--bookbar-offset", `${element.offsetHeight}px`)
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--bookbar-offset");
    };
  }, [showBar]);

  useEffect(() => {
    if (!confirmed) return;
    window.scrollTo({ top: 0 });
    document.getElementById("booking-receipt")?.focus({ preventScroll: true });
  }, [confirmed]);

  const days = useMemo(
    () =>
      Array.from({ length: RULES.bookingWindowDays }, (_, i) => {
        const day = addDays(today.date, i);
        const open = getAvailability(
          day,
          duration,
          COURTS,
          withoutMoving(bookingsFor(day)),
          RULES,
          now
        ).filter(slot => slot.status === "open").length;
        return { day, open };
      }),
    [today.date, duration, version, now, moving]
  );

  const alternativesFor = (exclude?: Alternative) =>
    findAlternatives({
      date,
      duration,
      preferredStart: start,
      courts: COURTS,
      bookingsFor: day => withoutMoving(bookingsFor(day)),
      rules: RULES,
      now,
      exclude,
    });

  const chooseAlternative = (option: Alternative) => {
    setNotice(
      `Moved to ${formatShortDay(option.date)}, ${formatTime(option.start)} for ${formatDuration(option.duration)}.`
    );
    setSubmitError(null);
    setParams({
      date: option.date,
      dur: String(option.duration),
      time: toClock(option.start),
      court: null,
    });
  };

  const selectDate = (day: string) => {
    setNotice("");
    setParams({ date: day });
  };
  const selectDuration = (minutes: number) => {
    setNotice("");
    setParams({ dur: String(minutes) });
  };
  const selectTime = (slot: SlotAvailability) => {
    if (slot.status !== "open") return;
    setNotice("");
    if (courtId && !slot.freeCourtIds.includes(courtId)) {
      setNotice(
        `${courtName(courtId)} is booked at ${formatTime(slot.start)}, so we'll assign the best free court.`
      );
      setParams({
        date,
        dur: String(duration),
        time: toClock(slot.start),
        court: null,
      });
    } else {
      setParams({ date, dur: String(duration), time: toClock(slot.start) });
    }
  };

  const clearSelection = () => {
    setParams({ time: null, court: null });
    setDetails(EMPTY_DETAILS);
    setProof(null);
    setStep("select");
    setNotice("Selection cleared.");
  };
  const detailsFilled = Boolean(
    details.name || details.mobile || details.email || details.notes
  );

  const goNext = () => {
    if (!selectionValid) return;
    setSubmitError(null);
    setStep(moving ? "review" : "details");
  };

  const confirm = async () => {
    if (!selectionValid || start === null || submitting) return;
    if (!moving && method === "qr" && !proof) {
      setPaymentError(
        "Upload your payment screenshot, or choose cash at the front desk."
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const slot = { date, start, duration, courtId };
    try {
      const booking = moving
        ? await rescheduleBooking(moving.id, slot)
        : await createBooking({
            ...slot,
            name: details.name,
            mobile: normalizePhMobile(details.mobile)!,
            email: details.email,
            notes: details.notes,
            payment: method,
            proof: method === "qr" ? (proof ?? undefined) : undefined,
          });
      setDetails(current => ({ ...current, notes: "" }));
      setProof(null);
      setStep("select");
      setShowCourts(false);
      setParams({
        ref: booking.ref,
        reschedule: null,
        time: null,
        court: null,
      });
      toast(
        moving
          ? `Booking moved to ${formatShortDay(booking.date)}, ${formatTime(booking.start)}`
          : `Court booked. Reference ${booking.ref}`
      );
    } catch (error) {
      if (error instanceof SlotTakenError) {
        setLoaded({ date, bookings: bookingsFor(date) });
        setSubmitError(error.message);
      } else {
        setSubmitError((error as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="book-page is-receipt">
        <BookingReceipt
          booking={confirmed}
          onBookAnother={() =>
            setParams({ ref: null, time: null, court: null }, "push")
          }
        />
      </div>
    );
  }

  const openSlots = availability?.filter(slot => slot.status === "open") ?? [];
  const dayFull = availability !== null && openSlots.length === 0;
  const dayClosed = availability?.every(
    slot => slot.status === "past" || slot.status === "closing"
  );
  const conflict =
    step === "review" && availability !== null && !selectionValid;
  const steps = moving ? ["Time", "Confirm"] : ["Time", "Details", "Confirm"];
  const stepIndex =
    step === "select" ? 0 : step === "details" ? 1 : steps.length - 1;
  const when =
    start !== null
      ? `${formatShortDay(date)} · ${formatTimeRange(start, start + duration)}`
      : null;

  const summary = (
    <div className="summary-body">
      <span className="summary-label">
        {moving ? `MOVING ${moving.ref}` : "YOUR GAME"}
      </span>
      {start !== null && selectionValid ? (
        <>
          <h2 className="summary-court">
            {courtName(assignedCourt!)}
            {!courtId && <small> best available</small>}
          </h2>
          <p className="summary-when">
            {formatLongDay(date)}
            <br />
            {formatTimeRange(start, start + duration)} ·{" "}
            {formatDuration(duration)}
          </p>
        </>
      ) : (
        <>
          <h2 className="summary-court is-empty">Pick a time</h2>
          <p className="summary-when">
            {formatLongDay(date)} · {formatDuration(duration)}
          </p>
        </>
      )}
      {price && selectionValid && (
        <dl className="price-lines">
          {price.offPeakMins > 0 && (
            <div>
              <dt>Off-peak · {formatDuration(price.offPeakMins)}</dt>
              <dd>
                {formatPeso((price.offPeakMins / 60) * PRICING.offPeakPerHour)}
              </dd>
            </div>
          )}
          {price.peakMins > 0 && (
            <div>
              <dt>Peak · {formatDuration(price.peakMins)}</dt>
              <dd>{formatPeso((price.peakMins / 60) * PRICING.peakPerHour)}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="summary-total" aria-live="polite" aria-atomic="true">
        <span>Total</span>
        <strong>
          {price && selectionValid ? formatPeso(price.total) : formatPeso(0)}
        </strong>
        <span className="sr-only">
          {price && selectionValid ? ` for ${when}` : ""}
        </span>
      </div>
      <p className="summary-note">
        <Info size={13} aria-hidden="true" /> Whole court, no player cap. Expect
        a {RULES.changeoverMins} minute changeover buffer at the start.
      </p>
    </div>
  );

  const review = (
    <div className="review-step">
      {conflict ? (
        <div className="taken-panel" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          <div>
            <strong>
              {start !== null
                ? `${formatShortDay(date)}, ${formatTime(start)}`
                : "That time"}{" "}
              was just booked.
            </strong>
            <span>Pick one of these instead. Your details are saved.</span>
            <AlternativeChips
              options={alternativesFor(
                start !== null ? { date, start, duration } : undefined
              )}
              onPick={chooseAlternative}
            />
          </div>
        </div>
      ) : (
        <dl className="review-lines">
          <div>
            <dt>Court</dt>
            <dd>{assignedCourt && courtName(assignedCourt)}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>{when}</dd>
          </div>
          {!moving && (
            <div>
              <dt>Player</dt>
              <dd>
                {details.name} · {normalizePhMobile(details.mobile)}
              </dd>
            </div>
          )}
        </dl>
      )}
      {moving ? (
        <p className="payment-note">
          Your payment carries over. Any price difference is settled at the
          front desk.
        </p>
      ) : (
        <PaymentPicker
          method={method}
          onMethod={value => {
            setMethod(value);
            setPaymentError(null);
          }}
          proof={proof}
          onProof={value => {
            setProof(value);
            setPaymentError(null);
          }}
          error={paymentError}
        />
      )}
      {submitError && !conflict && (
        <p className="field-error" role="alert">
          <CircleAlert size={14} aria-hidden="true" /> {submitError}
        </p>
      )}
      <div className="checkout-actions">
        <button
          type="button"
          className="outline-button"
          onClick={() => setStep(moving ? "select" : "details")}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          className="lime-button"
          onClick={confirm}
          disabled={submitting || conflict}
          aria-disabled={submitting || conflict}
        >
          {submitting ? (
            <>
              <span className="spinner" aria-hidden="true" /> Confirming…
            </>
          ) : (
            <>
              <Check size={16} />{" "}
              {moving
                ? "Confirm new time"
                : `Confirm · ${price ? formatPeso(price.total) : ""}`}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const checkout =
    step === "details" ? (
      <DetailsForm
        details={details}
        onChange={setDetails}
        onBack={() => setStep("select")}
        onNext={() => setStep("review")}
      />
    ) : step === "review" ? (
      review
    ) : null;

  const stepper = (
    <ol className="book-stepper" aria-label="Booking progress">
      {steps.map((label, index) => (
        <li
          key={label}
          className={
            index < stepIndex
              ? "is-done"
              : index === stepIndex
                ? "is-current"
                : ""
          }
          aria-current={index === stepIndex ? "step" : undefined}
        >
          <span aria-hidden="true">
            {index < stepIndex ? <Check size={12} /> : index + 1}
          </span>
          {label}
          {index < stepIndex && <span className="sr-only"> (done)</span>}
        </li>
      ))}
    </ol>
  );

  return (
    <div className="book-page">
      <header className="book-head">
        <div>
          <div className="eyebrow">
            {moving ? "RESCHEDULE" : "BOOK A COURT"}
          </div>
          <h1>
            {moving ? (
              <>
                Pick a new
                <br />
                <em>time.</em>
              </>
            ) : (
              <>
                Pick a time.
                <br />
                <em>We'll find the court.</em>
              </>
            )}
          </h1>
          {moving && (
            <p className="moving-note">
              Moving {moving.ref}: currently {formatShortDay(moving.date)},{" "}
              {formatTimeRange(moving.start, moving.start + moving.duration)} on{" "}
              {courtName(moving.courtId)}.
            </p>
          )}
        </div>
        {stepper}
      </header>

      <div className="book-layout">
        <div className="book-main">
          <section className="book-zone" aria-labelledby="zone-when">
            <h2 id="zone-when" className="zone-title">
              <span>1</span> When
            </h2>
            <div className="when-row">
              <div className="date-strip-wrap">
                <div
                  className="date-strip"
                  role="radiogroup"
                  aria-label="Date"
                  onKeyDown={onRadioGroupKeyDown}
                >
                  {days.map(({ day, open }, index) => {
                    const checked = day === date;
                    const level =
                      open === 0 ? "none" : open <= 4 ? "few" : "many";
                    return (
                      <button
                        type="button"
                        role="radio"
                        key={day}
                        aria-checked={checked}
                        tabIndex={rovingTabIndex(checked, index === 0, true)}
                        className={`date-chip ${checked ? "is-checked" : ""} is-${level}`}
                        onClick={() => selectDate(day)}
                        aria-label={`${formatLongDay(day)}, ${open === 0 ? "fully booked" : `${open} open time${open === 1 ? "" : "s"}`}`}
                      >
                        <span className="date-chip-day">
                          {index === 0 ? "Today" : formatWeekday(day)}
                        </span>
                        <strong>{Number(day.slice(8))}</strong>
                        <span className="date-chip-dot" aria-hidden="true">
                          <i />
                          {open === 0 ? "Full" : open <= 4 ? "Few" : "Open"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="more-dates outline-button">
                      <CalendarDays size={16} /> More dates
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="calendar-pop"
                    align="end"
                    collisionPadding={16}
                  >
                    <Suspense
                      fallback={<div className="calendar-loading skeleton" />}
                    >
                      <MonthCalendar
                        mode="single"
                        selected={toLocalDate(date)}
                        defaultMonth={toLocalDate(date)}
                        onSelect={value =>
                          value && selectDate(fromLocalDate(value))
                        }
                        disabled={{
                          before: toLocalDate(today.date),
                          after: toLocalDate(lastDay),
                        }}
                        showOutsideDays={false}
                        className="[--cell-size:44px]"
                      />
                    </Suspense>
                    <p className="calendar-note">
                      Book up to {RULES.bookingWindowDays} days ahead.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="duration-picker">
                <span className="zone-label" id="duration-label">
                  Play for
                </span>
                <div
                  className="segmented"
                  role="radiogroup"
                  aria-labelledby="duration-label"
                  onKeyDown={onRadioGroupKeyDown}
                >
                  {RULES.durations.map(minutes => {
                    const checked = minutes === duration;
                    return (
                      <button
                        type="button"
                        role="radio"
                        key={minutes}
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        className={checked ? "is-checked" : ""}
                        onClick={() => selectDuration(minutes)}
                      >
                        {checked && <Check size={14} aria-hidden="true" />}
                        {durationLabel(minutes)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <p className="book-notice" role="status" aria-live="polite">
              {notice}
            </p>
          </section>

          <section
            className="book-zone"
            aria-labelledby="zone-time"
            aria-busy={availability === null}
          >
            <div className="zone-head">
              <h2 id="zone-time" className="zone-title">
                <span>2</span> Time
              </h2>
              <div className="slot-legend" aria-hidden="true">
                <span>
                  <i className="legend-peak" /> Peak rate
                </span>
                <span>
                  <i className="legend-off" /> Unavailable
                </span>
              </div>
            </div>

            {availability === null ? (
              <SlotSkeleton />
            ) : (
              <>
                {dayFull && (
                  <div className="dead-end" role="status">
                    <strong>
                      {dayClosed
                        ? `Booking for ${formatShortDay(date)} has closed.`
                        : `Every court is booked for ${formatDuration(duration)} on ${formatShortDay(date)}.`}
                    </strong>
                    <span>These are the closest open options:</span>
                    <AlternativeChips
                      options={alternativesFor()}
                      onPick={chooseAlternative}
                    />
                  </div>
                )}
                <div
                  className="slot-grid"
                  role="radiogroup"
                  aria-labelledby="zone-time"
                  onKeyDown={onRadioGroupKeyDown}
                >
                  {GROUPS.map(group => {
                    const slots = availability.filter(slot =>
                      group.test(slot.start)
                    );
                    if (slots.every(slot => slot.status === "past"))
                      return (
                        <p className="slot-group-past" key={group.label}>
                          {group.label}: these times have passed.
                        </p>
                      );
                    return (
                      <div
                        className="slot-group"
                        role="group"
                        aria-label={group.label}
                        key={group.label}
                      >
                        <h3>{group.label}</h3>
                        <div className="slot-row">
                          {slots.map(slot => (
                            <SlotButton
                              key={slot.start}
                              slot={slot}
                              date={date}
                              duration={duration}
                              checked={slot.start === start && selectionValid}
                              tabbable={
                                start !== null && selectionValid
                                  ? slot.start === start
                                  : slot === (openSlots[0] ?? availability[0])
                              }
                              onSelect={() => selectTime(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {selected && selectionValid && (
              <div className="court-picker">
                <button
                  type="button"
                  className="text-toggle"
                  aria-expanded={showCourts}
                  aria-controls="court-options"
                  onClick={() => setShowCourts(value => !value)}
                >
                  {showCourts
                    ? "Let the club pick my court"
                    : "Choose a specific court"}
                </button>
                {showCourts && (
                  <div
                    id="court-options"
                    className="court-options"
                    role="radiogroup"
                    aria-label={`Court at ${formatTime(selected.start)}`}
                    onKeyDown={onRadioGroupKeyDown}
                  >
                    {[null, ...COURTS.map(court => court.id)].map(id => {
                      const free =
                        id === null || selected.freeCourtIds.includes(id);
                      const checked = id === courtId;
                      return (
                        <button
                          type="button"
                          role="radio"
                          key={id ?? "auto"}
                          aria-checked={checked}
                          aria-disabled={!free}
                          tabIndex={checked ? 0 : -1}
                          className={`court-option ${checked ? "is-checked" : ""} ${free ? "" : "is-off"}`}
                          onClick={() => {
                            if (!free) return;
                            setNotice("");
                            setParams({ court: id });
                          }}
                          title={free ? undefined : "Booked at this time"}
                        >
                          <span className="choice-check" aria-hidden="true">
                            {checked && <Check size={13} />}
                          </span>
                          {id === null ? (
                            <span>
                              <strong>Best available</strong>
                              <small>
                                {courtName(selected.freeCourtIds[0])}
                              </small>
                            </span>
                          ) : (
                            <span>
                              <strong>{courtName(id)}</strong>
                              <small>{free ? "Free" : "Booked"}</small>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="book-aside" aria-label="Booking summary">
          <div className="summary-card">
            {summary}
            {step === "select" || isMobile ? (
              <div className="summary-actions">
                <button
                  type="button"
                  className="dark-button wide"
                  onClick={goNext}
                  disabled={!selectionValid}
                >
                  Continue <ArrowRight size={16} />
                </button>
                {start !== null && (
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={() =>
                      detailsFilled ? setConfirmClear(true) : clearSelection()
                    }
                  >
                    <RotateCcw size={14} /> Clear selection
                  </button>
                )}
              </div>
            ) : (
              <div className="summary-checkout">
                <h3 className="checkout-title">
                  {step === "details" ? "Your details" : "Review and confirm"}
                </h3>
                {checkout}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showBar &&
        // Portalled: the view wrapper animates with a transform, which would
        // otherwise pin this fixed bar to the wrapper instead of the screen.
        createPortal(
          <div className="book-bar" ref={bar}>
            <div
              className="book-bar-info"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectionValid && start !== null ? (
                <>
                  <strong>
                    {courtName(assignedCourt!)} · {formatTime(start)}
                  </strong>
                  <span>
                    {formatShortDay(date)} · {durationLabel(duration)} ·{" "}
                    {price && formatPeso(price.total)}
                  </span>
                </>
              ) : (
                <>
                  <strong>Pick a time</strong>
                  <span>
                    {formatShortDay(date)} · {durationLabel(duration)}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              className="lime-button"
              onClick={goNext}
              disabled={!selectionValid}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>,
          document.body
        )}

      {sheetUsed && (
        <Suspense fallback={null}>
          <BookingSheet
            open={sheetOpen}
            onClose={() => setStep("select")}
            header={stepper}
            title={step === "details" ? "Your details" : "Review and confirm"}
            description={
              <>
                {assignedCourt && courtName(assignedCourt)} · {when} ·{" "}
                {price && formatPeso(price.total)}
              </>
            }
          >
            {checkout}
          </BookingSheet>
        </Suspense>
      )}

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Clear your selection?"
        description="This removes the time you picked and the details you entered."
        confirmLabel="Clear everything"
        cancelLabel="Keep them"
        onConfirm={clearSelection}
      />
    </div>
  );
}

function SlotButton({
  slot,
  date,
  duration,
  checked,
  tabbable,
  onSelect,
}: {
  slot: SlotAvailability;
  date: string;
  duration: number;
  checked: boolean;
  tabbable: boolean;
  onSelect: () => void;
}) {
  const open = slot.status === "open";
  const peak = isPeakMinute(date, slot.start);
  const reason = slotReason(slot, RULES);
  const price = getPrice(date, slot.start, duration).total;
  const label = open
    ? `${formatTime(slot.start)}, ${formatPeso(price)}${peak ? ", peak rate" : ""}, ${courtsLeft(slot.freeCourtIds.length)}`
    : `${formatTime(slot.start)}, unavailable: ${reason}`;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={!open}
      aria-label={label}
      tabIndex={tabbable ? 0 : -1}
      className={`slot-tile ${checked ? "is-checked" : ""} ${open ? "" : "is-off"} ${peak ? "is-peak" : ""}`}
      onClick={onSelect}
      data-reason={reason || undefined}
    >
      <span className="slot-check" aria-hidden="true">
        {checked && <Check size={12} />}
      </span>
      <strong>{formatTime(slot.start)}</strong>
      {open ? (
        <>
          <span className="slot-price">{formatPeso(price)}</span>
          <span
            className={`slot-left ${slot.freeCourtIds.length === 1 ? "is-last" : ""}`}
          >
            {courtsLeft(slot.freeCourtIds.length)}
          </span>
        </>
      ) : (
        <span className="slot-off">
          {slot.status === "full"
            ? "Booked"
            : slot.status === "past"
              ? "Passed"
              : "Too late"}
        </span>
      )}
    </button>
  );
}

function AlternativeChips({
  options,
  onPick,
}: {
  options: Alternative[];
  onPick: (option: Alternative) => void;
}) {
  if (!options.length)
    return (
      <span>
        Nothing is open in the next two weeks. Call the front desk and we'll
        help.
      </span>
    );
  return (
    <div className="alt-chips">
      {options.map(option => (
        <button
          type="button"
          key={`${option.date}-${option.start}-${option.duration}`}
          className="alt-chip"
          onClick={() => onPick(option)}
        >
          <strong>
            {formatShortDay(option.date)} · {formatTime(option.start)}
          </strong>
          <span>
            {durationLabel(option.duration)} ·{" "}
            {formatPeso(
              getPrice(option.date, option.start, option.duration).total
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="slot-grid is-loading">
      {GROUPS.map(group => (
        <div className="slot-group" key={group.label}>
          <span className="skeleton-line" aria-hidden="true" />
          <div className="slot-row" aria-hidden="true">
            {Array.from(
              {
                length:
                  group.label === "Evening"
                    ? 5
                    : group.label === "Morning"
                      ? 6
                      : 5,
              },
              (_, i) => (
                <span className="slot-tile skeleton" key={i} />
              )
            )}
          </div>
        </div>
      ))}
      <span className="sr-only" role="status">
        Loading available times
      </span>
    </div>
  );
}
