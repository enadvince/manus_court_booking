import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  Copy,
  LogIn,
  LogOut,
  Settings2,
  Sparkles,
} from "lucide-react";
import {
  BookingActions,
  CopyRef,
  isUpcoming,
  PAYMENT_STATUS,
} from "@/components/booking/BookingReceipt";
import { useBookingsVersion } from "@/components/booking/bookingState";
import { firstName, type Member } from "@/lib/auth";
import { copyText } from "@/lib/clipboard";
import { courtName } from "@/lib/booking/ics";
import { formatPeso } from "@/lib/booking/rules";
import { myBookings } from "@/lib/booking/store";
import {
  formatDuration,
  formatLongDay,
  formatShortDay,
  formatTimeRange,
} from "@/lib/booking/time";

/** Bookings made on this device, for members and guests alike. */
export function AccountView({
  goBook,
  member,
  onSignOut,
  onSignIn,
}: {
  goBook: () => void;
  member: Member | null;
  onSignOut: () => void;
  onSignIn: () => void;
}) {
  useBookingsVersion();
  const all = myBookings();
  const upcoming = all.filter(booking => isUpcoming(booking));
  const history = all.filter(booking => !isUpcoming(booking)).reverse();
  return (
    <div className="account-page">
      <div className="account-header">
        <div>
          <div className="eyebrow">
            {member ? "MEMBER AREA" : "MY BOOKINGS"}
          </div>
          <h1>{member ? `Hey, ${firstName(member.name)}.` : "Your games."}</h1>
          <p>
            {upcoming.length
              ? "Your next good game is already on the calendar."
              : "Nothing on the calendar yet. Let's fix that."}
            {!member && " These are the bookings made on this device."}
          </p>
        </div>
        <div className="account-header-actions">
          {member ? (
            <>
              <button
                className="dark-button"
                onClick={() => toast("Profile settings opened")}
              >
                Account settings <Settings2 size={16} />
              </button>
              <button className="outline-button" onClick={onSignOut}>
                <LogOut size={15} /> Sign out
              </button>
            </>
          ) : (
            <button className="outline-button" onClick={onSignIn}>
              <LogIn size={15} /> Sign in
            </button>
          )}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="upcoming-card is-empty">
          <div className="upcoming-content">
            <div>
              <span className="summary-label">NO UPCOMING GAMES</span>
              <h2>Your court is waiting.</h2>
            </div>
            <div className="upcoming-actions">
              <button className="lime-button" onClick={goBook}>
                Book a court <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        upcoming.map(booking => (
          <div className="upcoming-card" key={booking.id}>
            <div className="upcoming-top">
              <span className="status-pill">UPCOMING</span>
              <span className="upcoming-ref">
                {booking.ref} <CopyRef value={booking.ref} />
              </span>
            </div>
            <div className="upcoming-content">
              <div>
                <span className="summary-label">
                  {formatLongDay(booking.date).toUpperCase()}
                </span>
                <h2>{courtName(booking.courtId)}</h2>
                <p>
                  {formatTimeRange(
                    booking.start,
                    booking.start + booking.duration
                  )}{" "}
                  · {formatPeso(booking.total)} ·{" "}
                  {PAYMENT_STATUS[booking.paymentStatus]}
                </p>
              </div>
              <BookingActions booking={booking} compact />
            </div>
          </div>
        ))
      )}

      <div className="account-columns">
        <section>
          <div className="section-title">
            <h2>Past and cancelled</h2>
          </div>
          {history.length === 0 ? (
            <p className="history-empty">
              Finished and cancelled bookings show up here.
            </p>
          ) : (
            history.map(booking => (
              <div className="history-row" key={booking.id}>
                <div className="history-icon">
                  <CalendarDays size={17} />
                </div>
                <div>
                  <strong>
                    {courtName(booking.courtId)} ·{" "}
                    {formatShortDay(booking.date)}
                  </strong>
                  <span>
                    {formatDuration(booking.duration)} ·{" "}
                    {formatPeso(booking.total)} · {booking.ref}
                  </span>
                </div>
                <span className="history-status">
                  {booking.status === "cancelled" ? "Cancelled" : "Completed"}
                </span>
              </div>
            ))
          )}
        </section>
        <aside className="member-card">
          <Sparkles size={18} />
          <span>
            {member
              ? `MEMBER SINCE ${new Date(member.createdAt).getFullYear()}`
              : "BRING YOUR CREW"}
          </span>
          <strong>
            Keep your
            <br />
            rally going.
          </strong>
          <button
            onClick={async () =>
              toast(
                (await copyText(`${window.location.origin}/?view=book`))
                  ? "Invite link copied"
                  : "Couldn’t copy the invite link"
              )
            }
          >
            Invite a friend <Copy size={14} />
          </button>
        </aside>
      </div>
    </div>
  );
}
