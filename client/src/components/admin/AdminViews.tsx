import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import {
  openBooking,
  useBookingsVersion,
} from "@/components/booking/bookingState";
import { CodeBlock } from "@/components/site/CodeBlock";
import { ConfirmDialog } from "@/components/site/Dialogs";
import { Mark } from "@/components/site/Mark";
import { MAIN_ID } from "@/components/site/SiteChrome";
import { openSearch } from "@/components/site/SiteSearch";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
  dashboardAttention,
  dashboardBookings,
  getDashboardSummary,
  revenuePulse,
} from "@/lib/adminDashboard";
import type { BookedSlot } from "@/lib/booking/availability";
import { courtName } from "@/lib/booking/ics";
import { COURTS, formatPeso, PRICING, RULES } from "@/lib/booking/rules";
import {
  bookingsFor,
  myBookings,
  setPaymentStatus,
  type Booking,
} from "@/lib/booking/store";
import {
  addDays,
  formatLongDay,
  formatShortDay,
  formatTime,
  formatTimeRange,
  manilaNow,
} from "@/lib/booking/time";
import type { AdminView } from "@/lib/navigation";

export function AdminShell({
  view,
  setView,
  children,
  exit,
}: {
  view: AdminView;
  setView: (v: AdminView) => void;
  children: ReactNode;
  exit: () => void;
}) {
  const nav = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "schedule", label: "Schedule", icon: CalendarDays },
    { id: "resources", label: "Resources", icon: Trophy },
    { id: "customers", label: "Customers", icon: Users },
    { id: "settings", label: "Settings", icon: Settings2 },
  ] as const;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Mark />
          <span>
            baseline <small>club ops</small>
          </span>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Club ops">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-current={view === id ? "page" : undefined}
              aria-label={label}
              onClick={() => setView(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-user">
            <span>AC</span>
            <div>
              <strong>Alex Cruz</strong>
              <small>Owner</small>
            </div>
            <MoreHorizontal size={16} />
          </div>
          <div className="admin-tools">
            <button
              className="exit-admin"
              onClick={openSearch}
              aria-label="Search the site"
            >
              <Search size={14} />
              <span>Search</span>
            </button>
            <ThemeToggle className="exit-admin" />
          </div>
          <button
            className="exit-admin"
            onClick={exit}
            aria-label="View public site"
          >
            <ChevronLeft size={14} />
            <span>View public site</span>
          </button>
        </div>
      </aside>
      <main className="admin-content" id={MAIN_ID} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function AdminDashboard({
  setView,
}: {
  setView: (v: AdminView) => void;
}) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const today = manilaNow().date;
  const [showTomorrow, setShowTomorrow] = useState(false);
  const rangeLabel = (tomorrow: boolean) =>
    `${tomorrow ? "Tomorrow" : "Today"} · ${formatShortDay(tomorrow ? addDays(today, 1) : today)}`;
  const summary = getDashboardSummary(dashboardBookings);
  const visibleAttention = dashboardAttention.filter(
    item => !completedItems.includes(item.id)
  );
  const completeAttention = (id: string, title: string) => {
    setCompletedItems(items => [...items, id]);
    toast(`${title} marked complete`);
  };

  return (
    <>
      <div className="admin-topbar">
        <div>
          <span className="admin-breadcrumb">WORKSPACE / OVERVIEW</span>
          <h1>Good morning, Alex.</h1>
          <p className="admin-subtitle">
            Here’s what needs your attention before the first evening rally.
          </p>
        </div>
        <div className="admin-actions">
          <button
            className="outline-button"
            onClick={() => {
              setShowTomorrow(!showTomorrow);
              toast(`${showTomorrow ? "Today" : "Tomorrow"} selected`);
            }}
          >
            {rangeLabel(showTomorrow)} <ChevronDown size={15} />
          </button>
          <button className="lime-button" onClick={() => setView("schedule")}>
            <Plus size={16} /> Add booking
          </button>
        </div>
      </div>

      <section className="ops-pulse" aria-label="Daily operations pulse">
        <div>
          <span className="admin-breadcrumb">DAILY OPERATIONS PULSE</span>
          <h2>{summary.confirmed + summary.openPlay} sessions on the board.</h2>
          <p>
            {summary.available} court still open before lunch · evening peak
            starts at 6:00 PM
          </p>
        </div>
        <div className="pulse-stat">
          <strong>76%</strong>
          <span>utilization today</span>
          <div className="pulse-track">
            <i />
          </div>
        </div>
        <div className="pulse-stat">
          <strong>₱8,640</strong>
          <span>expected today</span>
          <div className="pulse-bars">
            {revenuePulse.map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </section>

      <div className="kpi-grid">
        <div className="kpi-card accent">
          <span>BOOKINGS TODAY</span>
          <strong>24</strong>
          <small>↑ 12% vs last Wednesday</small>
          <div className="spark-bars">
            {[35, 50, 42, 67, 55, 78, 62, 92, 80, 100].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="kpi-card">
          <span>REVENUE THIS WEEK</span>
          <strong>₱48,240</strong>
          <small className="positive">↑ 8.4% vs last week</small>
        </div>
        <div className="kpi-card">
          <span>COURT UTILIZATION</span>
          <strong>
            76<span>%</span>
          </strong>
          <small>Peak hours: 6–9 PM</small>
          <div className="utilization">
            <i />
          </div>
        </div>
        <div className="kpi-card">
          <span>ACTIVE MEMBERS</span>
          <strong>318</strong>
          <small>14 new this month</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="ops-card">
          <div className="card-heading">
            <div>
              <span className="admin-breadcrumb">LIVE SCHEDULE</span>
              <h2>Today on court</h2>
            </div>
            <button
              className="underlined-link"
              onClick={() => setView("schedule")}
            >
              Full schedule <ArrowRight size={14} />
            </button>
          </div>
          <div className="ops-list">
            {dashboardBookings.map(item => (
              <div className="ops-row" key={item.time}>
                <span className="ops-time">{item.time}</span>
                <span className={`ops-dot ${item.color}`} />
                <div>
                  <strong>{item.court}</strong>
                  <span>
                    {item.name} · {item.type}
                  </span>
                </div>
                {item.status === "available" ? (
                  <button
                    className="row-action"
                    onClick={() => setView("schedule")}
                  >
                    Fill slot <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    className="row-more"
                    aria-label={`Booking actions for ${item.court} at ${item.time}`}
                    onClick={() =>
                      toast(`${item.court} booking actions opened`)
                    }
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <aside className="insight-card">
          <div className="insight-orbit">
            <Gauge size={24} />
          </div>
          <span className="admin-breadcrumb">WEEKLY INSIGHT</span>
          <h2>
            Friday is your
            <br />
            <em>power hour.</em>
          </h2>
          <p>
            Courts are 94% full between 6–8 PM. Consider opening a second
            open-play session.
          </p>
          <button
            className="outline-light"
            onClick={() => toast("Insight saved")}
          >
            Save insight <ArrowRight size={14} />
          </button>
        </aside>
      </div>

      <PaymentChecks />

      <div className="dashboard-lower-grid">
        <section className="attention-card">
          <div className="card-heading">
            <div>
              <span className="admin-breadcrumb">NEEDS ATTENTION</span>
              <h2>Keep the floor moving.</h2>
            </div>
            <span className="attention-count">
              {visibleAttention.length} open
            </span>
          </div>
          {visibleAttention.length === 0 ? (
            <div className="attention-empty">
              <CheckCircle2 size={18} />
              <span>All clear. The club is ready for today.</span>
            </div>
          ) : (
            <div className="attention-list">
              {visibleAttention.map(item => (
                <div className="attention-row" key={item.id}>
                  <span className={`attention-icon ${item.tone}`}>
                    {item.tone === "warning" ? (
                      <CircleAlert size={15} />
                    ) : item.tone === "info" ? (
                      <Wrench size={15} />
                    ) : (
                      <Users size={15} />
                    )}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                  <button
                    className="quiet-button"
                    onClick={() => completeAttention(item.id, item.title)}
                  >
                    <CheckCircle2 size={15} /> Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="quick-actions-card">
          <span className="admin-breadcrumb">QUICK ACTIONS</span>
          <h2>Make the next move.</h2>
          <div className="quick-actions-list">
            <button onClick={() => setView("schedule")}>
              <Plus size={16} />
              <span>
                <strong>Add booking</strong>
                <small>Reserve a court for a member</small>
              </span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => toast("Open play setup started")}>
              <Sparkles size={16} />
              <span>
                <strong>Start open play</strong>
                <small>Set up a hosted session</small>
              </span>
              <ArrowRight size={14} />
            </button>
            <button onClick={() => toast("Member message composer opened")}>
              <MessageSquare size={16} />
              <span>
                <strong>Message members</strong>
                <small>Send an update to today’s players</small>
              </span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
/** QR payments waiting for the host to check the screenshot. */
function PaymentChecks() {
  useBookingsVersion();
  const [rejecting, setRejecting] = useState<Booking | null>(null);
  const pending = myBookings().filter(
    booking =>
      booking.status === "confirmed" && booking.paymentStatus === "submitted"
  );
  return (
    <section className="payment-card" aria-labelledby="payment-checks-title">
      <div className="card-heading">
        <div>
          <span className="admin-breadcrumb">PAYMENT CHECKS</span>
          <h2 id="payment-checks-title">QR screenshots to verify.</h2>
        </div>
        <span className="attention-count">{pending.length} waiting</span>
      </div>
      {pending.length === 0 ? (
        <div className="attention-empty">
          <CheckCircle2 size={18} />
          <span>
            No QR payments waiting. Cash bookings are collected at the desk.
          </span>
        </div>
      ) : (
        <div className="payment-list">
          {pending.map(booking => (
            <div className="payment-row" key={booking.id}>
              {booking.proof ? (
                <details className="proof-thumb">
                  <summary>
                    <img
                      src={booking.proof}
                      alt={`Payment screenshot for ${booking.ref}`}
                    />
                    <span className="sr-only">Enlarge screenshot</span>
                  </summary>
                  <img src={booking.proof} alt="" />
                </details>
              ) : (
                <span className="proof-thumb is-missing">No image</span>
              )}
              <div>
                <strong>
                  {booking.name} · {formatPeso(booking.total)}
                </strong>
                <span>
                  {booking.ref} · {courtName(booking.courtId)} ·{" "}
                  {formatShortDay(booking.date)},{" "}
                  {formatTimeRange(
                    booking.start,
                    booking.start + booking.duration
                  )}
                </span>
              </div>
              <div className="payment-actions">
                <button
                  className="lime-button"
                  onClick={() => {
                    setPaymentStatus(booking.id, "verified");
                    toast(`${booking.ref} marked as paid`);
                  }}
                >
                  <CheckCircle2 size={15} /> Verify
                </button>
                <button
                  className="quiet-button"
                  onClick={() => setRejecting(booking)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={rejecting !== null}
        onOpenChange={open => !open && setRejecting(null)}
        title="Reject this payment?"
        description={`The player behind ${rejecting?.ref ?? "this booking"} will be asked to pay at the front desk. The booking itself stays on the board.`}
        confirmLabel="Reject payment"
        cancelLabel="Keep checking"
        onConfirm={() => {
          if (!rejecting) return;
          setPaymentStatus(rejecting.id, "rejected");
          toast(`${rejecting.ref} payment rejected`);
        }}
      />
    </section>
  );
}

export function ScheduleView() {
  useBookingsVersion();
  const today = manilaNow().date;
  const [date, setDate] = useState(today);
  const firstDay = addDays(today, -7);
  const lastDay = addDays(today, RULES.bookingWindowDays - 1);
  const bookings = bookingsFor(date).filter(
    booking => booking.status !== "cancelled"
  );
  const hours = Array.from(
    { length: (RULES.closeMins - RULES.openMins) / RULES.stepMins },
    (_, i) => RULES.openMins + i * RULES.stepMins
  );
  return (
    <>
      <div className="admin-topbar">
        <div>
          <span className="admin-breadcrumb">WORKSPACE / SCHEDULE</span>
          <h1>Schedule</h1>
        </div>
        <div className="admin-actions">
          <button
            className="outline-button"
            aria-label="Previous day"
            disabled={date <= firstDay}
            onClick={() => setDate(addDays(date, -1))}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            className="outline-button"
            onClick={() => setDate(today)}
            aria-label={`${formatShortDay(date)}. Jump to today`}
          >
            {date === today ? "Today" : formatShortDay(date)}
          </button>
          <button
            className="outline-button"
            aria-label="Next day"
            disabled={date >= lastDay}
            onClick={() => setDate(addDays(date, 1))}
          >
            <ChevronRight size={15} />
          </button>
          <button
            className="lime-button"
            onClick={() => openBooking({ date: date >= today ? date : today })}
          >
            <Plus size={16} /> Add booking
          </button>
        </div>
      </div>
      <div className="schedule-card">
        <div className="schedule-head">
          <div>
            <span className="admin-breadcrumb">
              {formatLongDay(date).toUpperCase()}
            </span>
            <h2>All courts</h2>
          </div>
          <div className="legend">
            <span>
              <i className="legend-open" /> Available
            </span>
            <span>
              <i className="legend-busy" /> Booked
            </span>
            <span>
              <i className="legend-selected" /> Booked online
            </span>
          </div>
        </div>
        <div className="schedule-grid is-hourly">
          <div className="schedule-times">
            <span />
            {hours.map(start => (
              <span key={start}>{formatTime(start).replace(":00", "")}</span>
            ))}
          </div>
          {COURTS.map(court => (
            <div className="schedule-row" key={court.id}>
              <div className="schedule-label">
                <strong>{court.name}</strong>
                <small>{court.meta}</small>
              </div>
              <div className="schedule-cells">
                {hours.map(start => {
                  const booking = bookings.find(
                    item =>
                      item.courtId === court.id &&
                      item.start < start + RULES.stepMins &&
                      start < item.start + item.duration
                  ) as (BookedSlot & Partial<Booking>) | undefined;
                  const online = Boolean(booking?.ref);
                  const label = `${court.name}, ${formatTime(start)}: ${
                    booking
                      ? online
                        ? `booked online by ${booking.name}, ${booking.ref}`
                        : "booked"
                      : "available"
                  }`;
                  return (
                    <button
                      key={start}
                      className={
                        booking ? (online ? "open-play" : "booked") : "free"
                      }
                      aria-label={label}
                      onClick={() => toast(label)}
                    >
                      <span>
                        {booking ? (online ? booking.ref : "BOOKED") : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CustomerTable() {
  type Customer = {
    name: string;
    email: string;
    bookings: number;
    spend: number;
    lastVisit: string;
    status: "Member" | "New member" | "Inactive";
  };
  type SortKey = "name" | "bookings" | "spend" | "lastVisit" | "status";
  const customers: Customer[] = [
    {
      name: "Alex dela Cruz",
      email: "alex@example.com",
      bookings: 24,
      spend: 10800,
      lastVisit: "Today",
      status: "Member",
    },
    {
      name: "Mia Santos",
      email: "mia@example.com",
      bookings: 12,
      spend: 5400,
      lastVisit: "Yesterday",
      status: "Member",
    },
    {
      name: "Jon Bell",
      email: "jon@example.com",
      bookings: 3,
      spend: 1350,
      lastVisit: "18 Apr",
      status: "New member",
    },
    {
      name: "Camille Reyes",
      email: "camille@example.com",
      bookings: 18,
      spend: 8100,
      lastVisit: "17 Apr",
      status: "Member",
    },
    {
      name: "Paolo Lim",
      email: "paolo@example.com",
      bookings: 1,
      spend: 450,
      lastVisit: "12 Apr",
      status: "New member",
    },
    {
      name: "Nina Garcia",
      email: "nina@example.com",
      bookings: 0,
      spend: 0,
      lastVisit: "Never",
      status: "Inactive",
    },
    {
      name: "Rafael Tan",
      email: "rafael@example.com",
      bookings: 9,
      spend: 4050,
      lastVisit: "10 Apr",
      status: "Member",
    },
    {
      name: "Bea Navarro",
      email: "bea@example.com",
      bookings: 6,
      spend: 2700,
      lastVisit: "08 Apr",
      status: "Member",
    },
  ];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [bookingFilter, setBookingFilter] = useState("All activity");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const filteredCustomers = useMemo(
    () =>
      customers
        .filter(customer => {
          const matchesQuery = `${customer.name} ${customer.email}`
            .toLowerCase()
            .includes(query.toLowerCase());
          const matchesStatus =
            status === "All statuses" || customer.status === status;
          const matchesBookings =
            bookingFilter === "All activity" ||
            (bookingFilter === "Booked before"
              ? customer.bookings > 0
              : customer.bookings === 0);
          return matchesQuery && matchesStatus && matchesBookings;
        })
        .sort((a, b) => {
          const left = a[sortKey];
          const right = b[sortKey];
          const comparison =
            typeof left === "number" && typeof right === "number"
              ? left - right
              : String(left).localeCompare(String(right));
          return sortDirection === "asc" ? comparison : -comparison;
        }),
    [bookingFilter, query, sortDirection, sortKey, status]
  );
  const setSort = (key: SortKey) => {
    if (sortKey === key)
      setSortDirection(direction => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };
  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
    setBookingFilter("All activity");
  };
  const sortIcon = (key: SortKey) => (
    <ChevronDown
      size={13}
      className={`table-sort-icon ${sortKey === key ? "visible" : ""} ${sortKey === key && sortDirection === "desc" ? "desc" : ""}`}
    />
  );
  return (
    <>
      <div className="admin-topbar">
        <div>
          <span className="admin-breadcrumb">WORKSPACE / MEMBER DIRECTORY</span>
          <h1>Customers</h1>
        </div>
        <button
          className="lime-button"
          onClick={() => toast("New member form opened")}
        >
          <Plus size={16} /> Add member
        </button>
      </div>
      <div className="customer-intro">
        <div>
          <div className="eyebrow">MEMBER DIRECTORY</div>
          <h2>Know who’s on court.</h2>
          <p>
            Search your community, spot repeat players, and keep every member
            interaction in view.
          </p>
        </div>
        <div className="customer-count">
          <strong>{filteredCustomers.length}</strong>
          <span>of {customers.length} members shown</span>
        </div>
      </div>
      <div className="table-card customer-table-card">
        <div className="customer-toolbar">
          <label className="customer-search">
            <Search size={16} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by name or email…"
              aria-label="Search customers"
            />
          </label>
          <div className="customer-filters">
            <label>
              <SlidersHorizontal size={14} />
              <select
                value={status}
                onChange={event => setStatus(event.target.value)}
                aria-label="Filter by status"
              >
                <option>All statuses</option>
                <option>Member</option>
                <option>New member</option>
                <option>Inactive</option>
              </select>
            </label>
            <label>
              <select
                value={bookingFilter}
                onChange={event => setBookingFilter(event.target.value)}
                aria-label="Filter by booking activity"
              >
                <option>All activity</option>
                <option>Booked before</option>
                <option>No bookings</option>
              </select>
            </label>
            <button className="clear-filter" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>
        <div className="table-meta">
          <span>
            {filteredCustomers.length}{" "}
            {filteredCustomers.length === 1 ? "customer" : "customers"}
          </span>
          <span>Click a column to sort</span>
        </div>
        <div className="customer-table-wrap">
          <table className="customer-table">
            <thead>
              <tr>
                <th>
                  <button onClick={() => setSort("name")}>
                    Customer {sortIcon("name")}
                  </button>
                </th>
                <th>
                  <button onClick={() => setSort("bookings")}>
                    Bookings {sortIcon("bookings")}
                  </button>
                </th>
                <th>
                  <button onClick={() => setSort("spend")}>
                    Lifetime spend {sortIcon("spend")}
                  </button>
                </th>
                <th>
                  <button onClick={() => setSort("lastVisit")}>
                    Last visit {sortIcon("lastVisit")}
                  </button>
                </th>
                <th>
                  <button onClick={() => setSort("status")}>
                    Status {sortIcon("status")}
                  </button>
                </th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.email}>
                  <td>
                    <div className="customer-name">
                      <span>
                        {customer.name
                          .split(" ")
                          .map(part => part[0])
                          .join("")}
                      </span>
                      <div>
                        <strong>{customer.name}</strong>
                        <small>{customer.email}</small>
                      </div>
                    </div>
                  </td>
                  <td>{customer.bookings}</td>
                  <td>₱{customer.spend.toLocaleString()}</td>
                  <td>{customer.lastVisit}</td>
                  <td>
                    <span
                      className={`customer-status ${customer.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {customer.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="row-more"
                      onClick={() => toast(`${customer.name} actions opened`)}
                      aria-label={`Open actions for ${customer.name}`}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="customer-empty">
              <Search size={20} />
              <strong>No customers match those filters.</strong>
              <span>Try a broader search or clear the current filters.</span>
              <button className="underlined-link" onClick={clearFilters}>
                Clear filters <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Simple list with a working search box and status filter. */
function FilterableRows({ title, rows }: { title: string; rows: string[][] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const statuses = [
    "All",
    ...Array.from(new Set(rows.map(row => row.at(-1)!))),
  ];
  const visible = rows.filter(
    row =>
      (status === "All" || row.at(-1) === status) &&
      row.join(" ").toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <div className="table-card">
      <div className="table-toolbar">
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          aria-label={`Search ${title.toLowerCase()}`}
        />
        <label className="table-filter">
          <SlidersHorizontal size={14} />
          <select
            value={status}
            onChange={event => setStatus(event.target.value)}
            aria-label="Filter by status"
          >
            {statuses.map(option => (
              <option key={option} value={option}>
                {option === "All" ? "All statuses" : option}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visible.map(row => (
        <div className="table-row" key={row[0]}>
          {row.map((cell, j) => (
            <span
              key={j}
              className={
                j === row.length - 1
                  ? "row-badge"
                  : j === 0
                    ? "row-primary"
                    : ""
              }
            >
              {cell}
            </span>
          ))}
          <button
            className="row-more"
            aria-label={`Open actions for ${row[0]}`}
            onClick={() => toast(`${row[0]} actions opened`)}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      ))}
      {visible.length === 0 && (
        <p className="table-empty">Nothing matches that search.</p>
      )}
    </div>
  );
}

export function SimpleAdmin({
  kind,
}: {
  kind: Exclude<AdminView, "dashboard" | "schedule">;
}) {
  const simpleKind = kind as string;
  if (simpleKind === "customers") return <CustomerTable />;
  const titles: Record<
    Exclude<AdminView, "dashboard" | "schedule">,
    readonly [string, string, string]
  > = {
    resources: ["Resources", "Four courts, one clear view.", "COURT INVENTORY"],
    customers: ["Customers", "Know who’s on court.", "MEMBER DIRECTORY"],
    settings: ["Settings", "Make the rules clear.", "CLUB SETTINGS"],
  };
  const [title, sub, label] = titles[simpleKind as keyof typeof titles];
  return (
    <>
      <div className="admin-topbar">
        <div>
          <span className="admin-breadcrumb">WORKSPACE / {label}</span>
          <h1>{title}</h1>
        </div>
        <button
          className="lime-button"
          onClick={() => toast(`${title} action opened`)}
        >
          <Plus size={16} /> Add{" "}
          {simpleKind === "resources"
            ? "resource"
            : simpleKind === "customers"
              ? "member"
              : "rule"}
        </button>
      </div>
      <div className="simple-admin-intro">
        <div>
          <div className="eyebrow">{label}</div>
          <h2>{sub}</h2>
          <p>
            This reusable core view is ready to connect to your Supabase data
            model. The pickleball skin supplies the court names, surface labels,
            and club vocabulary.
          </p>
        </div>
        <div className="simple-number">
          {simpleKind === "resources"
            ? "04"
            : simpleKind === "customers"
              ? "318"
              : "12h"}
          <small>
            {simpleKind === "resources"
              ? "bookable courts"
              : simpleKind === "customers"
                ? "active members"
                : "cancellation window"}
          </small>
        </div>
      </div>
      <FilterableRows
        title={title}
        rows={
          simpleKind === "resources"
            ? COURTS.map(court => [
                court.name,
                court.meta,
                `${formatPeso(PRICING.offPeakPerHour)} to ${formatPeso(PRICING.peakPerHour)} / hr`,
                "Active",
              ])
            : [
                [
                  "Opening hours",
                  `Daily · ${formatTimeRange(RULES.openMins, RULES.closeMins)}`,
                  "",
                  "Active",
                ],
                [
                  "Booking grid",
                  `Hourly starts · ${RULES.changeoverMins} min changeover`,
                  "",
                  "Active",
                ],
                [
                  "Peak pricing",
                  `Weekdays ${formatTimeRange(PRICING.weekdayPeakStart, PRICING.weekdayPeakEnd)}, weekends all day`,
                  `${formatPeso(PRICING.peakPerHour)} / hr`,
                  "Active",
                ],
                ["Cancellation policy", "12 hours before start", "", "Active"],
                ["Blackout dates", "No blackout dates", "", "Clear"],
              ]
        }
      />
      {simpleKind === "settings" && <EmbedSettings />}
    </>
  );
}

function EmbedSettings() {
  const origin = window.location.origin;
  return (
    <section className="embed-card" aria-labelledby="embed-title">
      <div>
        <span className="admin-breadcrumb">SHARE YOUR BOARD</span>
        <h2 id="embed-title">Embed the booking board</h2>
        <p>
          Paste this snippet into any website to show live court availability.
          Players book straight from it.
        </p>
      </div>
      <CodeBlock
        label="Embed snippet"
        code={`<iframe\n  src="${origin}/?view=book"\n  title="Book a court at Baseline Pickle Club"\n  width="100%"\n  height="720"\n  style="border:0"\n  loading="lazy"\n></iframe>`}
      />
      <CodeBlock label="Direct booking link" code={`${origin}/?view=book`} />
    </section>
  );
}

export function AdminArea({
  view,
  setView,
  exit,
}: {
  view: AdminView;
  setView: (view: AdminView) => void;
  exit: () => void;
}) {
  return (
    <AdminShell view={view} setView={setView} exit={exit}>
      <div className="view-enter" key={view}>
        {view === "dashboard" ? (
          <AdminDashboard setView={setView} />
        ) : view === "schedule" ? (
          <ScheduleView />
        ) : (
          <SimpleAdmin kind={view} />
        )}
      </div>
    </AdminShell>
  );
}
