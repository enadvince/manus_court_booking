import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  CalendarPlus,
  Check,
  Copy,
  Download,
  MapPin,
  Printer,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/site/Dialogs";
import { copyText } from "@/lib/clipboard";
import { contact } from "@/lib/siteContent";
import { buildIcs, courtName, googleCalendarUrl } from "@/lib/booking/ics";
import { formatPeso, RULES } from "@/lib/booking/rules";
import {
  cancelBooking,
  type Booking,
  type PaymentStatus,
} from "@/lib/booking/store";
import {
  formatDuration,
  formatLongDay,
  formatTimeRange,
  manilaNow,
  toClock,
} from "@/lib/booking/time";
import { openBooking } from "./bookingState";

export const PAYMENT_LABEL: Record<Booking["payment"], string> = {
  cash: "Cash at the front desk",
  qr: "QR payment",
};

export const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  due: "Pay on arrival",
  submitted: "Screenshot sent, host verifying",
  verified: "Paid, verified by host",
  rejected: "Not verified, please pay at the desk",
};

export function isUpcoming(booking: Booking, now = new Date()) {
  const today = manilaNow(now);
  return (
    booking.status === "confirmed" &&
    (booking.date > today.date ||
      (booking.date === today.date &&
        booking.start + booking.duration > today.minutes))
  );
}

/** Copy button with an icon swap, adapted from Watermelon UI's Copy Confirm. */
export function CopyRef({ value }: { value: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [state]);
  return (
    <button
      type="button"
      className={`copy-ref ${state === "copied" ? "is-copied" : ""}`}
      onClick={async () =>
        setState((await copyText(value)) ? "copied" : "failed")
      }
      aria-label={`Copy booking reference ${value}`}
    >
      <span className="copy-ref-icon" key={state} aria-hidden="true">
        {state === "copied" ? <Check size={15} /> : <Copy size={15} />}
      </span>
      {state === "copied"
        ? "Copied"
        : state === "failed"
          ? "Copy failed"
          : "Copy"}
      <span className="sr-only" role="status">
        {state === "copied"
          ? "Booking reference copied"
          : state === "failed"
            ? "Copy failed. Select the reference and copy it."
            : ""}
      </span>
    </button>
  );
}

function downloadIcs(booking: Booking) {
  const blob = new Blob([buildIcs(booking)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${booking.ref}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Calendar, directions, reschedule and cancel for one booking. */
export function BookingActions({
  booking,
  compact = false,
}: {
  booking: Booking;
  compact?: boolean;
}) {
  const [confirm, setConfirm] = useState<"cancel" | "reschedule" | null>(null);
  const upcoming = isUpcoming(booking);
  const when = `${formatLongDay(booking.date)} · ${formatTimeRange(booking.start, booking.start + booking.duration)}`;
  return (
    <div className={`booking-actions ${compact ? "is-compact" : ""}`}>
      {upcoming && (
        <>
          <button
            type="button"
            className="outline-button"
            onClick={() => downloadIcs(booking)}
          >
            <Download size={15} /> Add to calendar (.ics)
          </button>
          <a
            className="outline-button"
            href={googleCalendarUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarPlus size={15} /> Google Calendar
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      )}
      {!compact && (
        <a
          className="outline-button"
          href={contact.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={15} /> Directions
          <span className="sr-only"> (opens Google Maps in a new tab)</span>
        </a>
      )}
      {!compact && (
        <button
          type="button"
          className="outline-button"
          onClick={() => window.print()}
        >
          <Printer size={15} /> Print receipt
        </button>
      )}
      {upcoming && (
        <>
          <button
            type="button"
            className="outline-button"
            onClick={() => setConfirm("reschedule")}
          >
            <CalendarClock size={15} /> Reschedule
          </button>
          <button
            type="button"
            className="quiet-button"
            onClick={() => setConfirm("cancel")}
          >
            <X size={15} /> Cancel booking
          </button>
        </>
      )}
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={open => !open && setConfirm(null)}
        title={`Cancel your ${courtName(booking.courtId)} booking?`}
        description={`${when}. Cancelling frees the court for other players and can't be undone. Inside 12 hours of the start, the court fee isn't refunded.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onConfirm={async () => {
          try {
            await cancelBooking(booking.id);
            toast(
              `Booking ${booking.ref} cancelled. The court is back on the board.`
            );
          } catch (error) {
            toast((error as Error).message);
          }
        }}
      />
      <ConfirmDialog
        open={confirm === "reschedule"}
        onOpenChange={open => !open && setConfirm(null)}
        title="Move this booking to a new time?"
        description={`Currently ${when}. Your booking stays as it is until you confirm the new time. Any price difference is settled at the front desk.`}
        confirmLabel="Pick a new time"
        cancelLabel="Keep this time"
        tone="neutral"
        onConfirm={() =>
          openBooking({
            reschedule: booking.ref,
            date: booking.date,
            dur: String(booking.duration),
            time: toClock(booking.start),
          })
        }
      />
    </div>
  );
}

export function BookingReceipt({
  booking,
  onBookAnother,
}: {
  booking: Booking;
  onBookAnother: () => void;
}) {
  const cancelled = booking.status === "cancelled";
  const rows: [string, string][] = [
    ["Court", courtName(booking.courtId)],
    ["Date", formatLongDay(booking.date)],
    ["Time", formatTimeRange(booking.start, booking.start + booking.duration)],
    ["Duration", formatDuration(booking.duration)],
    ["Player", booking.name],
    [
      "Payment",
      `${PAYMENT_LABEL[booking.payment]} · ${PAYMENT_STATUS[booking.paymentStatus]}`,
    ],
  ];
  return (
    <section
      className="booking-receipt"
      aria-labelledby="receipt-title"
      tabIndex={-1}
      id="booking-receipt"
    >
      <div className="receipt-head">
        <span className={`status-pill ${cancelled ? "is-cancelled" : ""}`}>
          {cancelled ? "CANCELLED" : "CONFIRMED"}
        </span>
        <h1 id="receipt-title">
          {cancelled ? (
            <>
              Booking
              <br />
              <em>cancelled.</em>
            </>
          ) : (
            <>
              See you
              <br />
              <em>on court.</em>
            </>
          )}
        </h1>
        <p className="print-only">
          {contact.address} · {contact.phone}
        </p>
      </div>
      <div className="receipt-ref">
        <span className="summary-label">BOOKING REFERENCE</span>
        <strong>{booking.ref}</strong>
        <CopyRef value={booking.ref} />
      </div>
      <dl className="receipt-rows">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div className="receipt-total">
          <dt>Total</dt>
          <dd>{formatPeso(booking.total)}</dd>
        </div>
      </dl>
      {!cancelled && (
        <p className="receipt-note">
          Courts turn over on the hour, so expect a {RULES.changeoverMins}{" "}
          minute changeover buffer at the start of your session. Free
          cancellation up to 12 hours before you play.
        </p>
      )}
      <BookingActions booking={booking} />
      <button
        type="button"
        className="underlined-link receipt-again"
        onClick={onBookAnother}
      >
        Book another court
      </button>
    </section>
  );
}
