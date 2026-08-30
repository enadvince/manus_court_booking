/* Baseline Pickle Club skin: court-first geometry, court green + ball yellow, Space Grotesk/DM Sans, editorial asymmetric rhythm. Core system: shell, lanes, stepper, account/admin views. Skin: pickleball vocabulary, court diagrams, racket add-on. */
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

type Mode = "public" | "admin";
type PublicView = "home" | "book" | "account";
type AdminView = "dashboard" | "schedule" | "resources" | "customers" | "settings";

type Slot = { time: string; state: "open" | "busy" | "selected" };

const slots: Slot[] = [
  { time: "06:00", state: "busy" },
  { time: "07:00", state: "open" },
  { time: "08:00", state: "open" },
  { time: "09:00", state: "busy" },
  { time: "10:00", state: "open" },
  { time: "11:00", state: "open" },
  { time: "12:00", state: "busy" },
];

const courts = [
  { name: "Court 01", meta: "Indoor · Tournament surface", tone: "green", price: "₱450 / hour" },
  { name: "Court 02", meta: "Indoor · Tournament surface", tone: "blue", price: "₱450 / hour" },
  { name: "Court 03", meta: "Indoor · Tournament surface", tone: "green", price: "₱450 / hour" },
  { name: "Court 04", meta: "Indoor · Tournament surface", tone: "blue", price: "₱450 / hour" },
];

function Mark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`brand-mark ${dark ? "brand-mark-dark" : ""}`} aria-hidden="true">
      <span />
    </span>
  );
}

function PublicHeader({ view, setView, onAdmin }: { view: PublicView; setView: (view: PublicView) => void; onAdmin: () => void }) {
  return (
    <header className="public-header">
      <button className="wordmark" onClick={() => setView("home")} aria-label="Baseline Pickle Club home">
        <Mark /> <span>baseline</span>
      </button>
      <nav className="public-nav" aria-label="Public navigation">
        <button className={view === "home" ? "active" : ""} onClick={() => setView("home")}>Club</button>
        <button className={view === "book" ? "active" : ""} onClick={() => setView("book")}>Book a court</button>
        <button className={view === "account" ? "active" : ""} onClick={() => setView("account")}>My bookings</button>
      </nav>
      <div className="header-actions">
        <button className="text-button desktop-only" onClick={() => toast("Member login is ready for your auth provider.")}>Sign in</button>
        <button className="pill-button" onClick={() => setView("book")}>Book now <ArrowRight size={15} /></button>
        <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => toast("Menu opened") }><Menu size={19} /></button>
      </div>
    </header>
  );
}

function Hero({ onBook }: { onBook: () => void }) {
  return (
    <section className="hero-section">
      <div className="hero-image" role="img" aria-label="Players rallying on an indoor pickleball court" />
      <div className="hero-overlay" />
      <div className="hero-copy">
        <div className="eyebrow light"><span className="eyebrow-dot" /> Cebu's court-first club</div>
        <h1>Your court<br /><span className="hero-accent">is waiting.</span></h1>
        <p>Book the game, not the back-and-forth. Four tournament-ready indoor courts, right in the heart of the city.</p>
        <button className="lime-button" onClick={onBook}>See open courts <ArrowRight size={17} /></button>
      </div>
      <div className="hero-stamp"><Trophy size={16} /> Open play, elevated</div>
      <div className="hero-scroll">SCROLL TO PLAY <span>↓</span></div>
    </section>
  );
}

function CourtLane({ court, selected, onSelect }: { court: typeof courts[number]; selected: string | null; onSelect: (value: string) => void }) {
  return (
    <div className={`court-lane ${selected === court.name ? "lane-selected" : ""}`}>
      <div className="court-info">
        <div className={`court-number ${court.tone}`}>{court.name.slice(-2)}</div>
        <div><strong>{court.name}</strong><small>{court.meta}</small></div>
      </div>
      <div className="lane-track">
        <div className="net-line" />
        {slots.map((slot, i) => (
          <button key={slot.time} disabled={slot.state === "busy"} className={`slot ${slot.state} ${selected === `${court.name}-${slot.time}` ? "slot-selected" : ""}`} onClick={() => onSelect(`${court.name}-${slot.time}`)} aria-label={`${court.name} ${slot.time} ${slot.state === "busy" ? "unavailable" : "available"}`}>
            {slot.state === "busy" ? <span className="slot-dash">—</span> : <>{slot.time}<small>open</small></>}
          </button>
        ))}
      </div>
      <div className="court-price">{court.price}</div>
    </div>
  );
}

function BookingBoard({ onConfirm }: { onConfirm: (court: string) => void }) {
  const [selected, setSelected] = useState<string | null>("Court 02-08:00");
  const selectedLabel = selected?.replace("-", " · ") || "Choose a slot";
  return (
    <section className="booking-section" id="book">
      <div className="section-kicker">01 / FIND YOUR LANE</div>
      <div className="board-heading">
        <div><h2>Open courts,<br /><span>at a glance.</span></h2><p>Pick a day, then choose your lane. We’ll keep the rest simple.</p></div>
        <div className="date-control"><button className="icon-button" aria-label="Previous day"><ChevronLeft size={17} /></button><div><small>Wednesday</small><strong>24 April 2024</strong></div><button className="icon-button" aria-label="Next day"><ChevronRight size={17} /></button></div>
      </div>
      <div className="availability-toolbar"><div className="day-tabs"><button className="day-tab active"><b>WED</b><span>24</span></button><button className="day-tab"><b>THU</b><span>25</span></button><button className="day-tab"><b>FRI</b><span>26</span></button><button className="day-tab"><b>SAT</b><span>27</span></button></div><div className="legend"><span><i className="legend-open" /> Open</span><span><i className="legend-busy" /> Booked</span></div></div>
      <div className="court-board">{courts.map((court) => <CourtLane key={court.name} court={court} selected={selected?.startsWith(court.name) ? selected : null} onSelect={setSelected} />)}</div>
      <div className="booking-summary"><div><span className="summary-label">YOUR SESSION</span><strong>{selectedLabel}</strong><small>60 minutes · Tournament surface</small></div><button className="dark-button" onClick={() => onConfirm(selected || "Court 02-08:00")}>Continue <ArrowRight size={16} /></button></div>
    </section>
  );
}

function QuickCourtPreview({ goBook }: { goBook: () => void }) { return <section className="quick-board"><div className="quick-board-copy"><div className="eyebrow">RIGHT NOW / WED 24 APR</div><h2>See the open<br /><span>lanes.</span></h2><p>Choose a time, choose a court, and get straight to the good part.</p><button className="underlined-link" onClick={goBook}>Show me the full board <ArrowRight size={15} /></button></div><div className="quick-lanes"><div className="quick-lane-header"><span>COURT</span><span>06:00</span><span>08:00</span><span>10:00</span><span>12:00</span></div>{courts.slice(0, 2).map((court, index) => <div className="quick-lane" key={court.name}><div className={`quick-court-label ${court.tone}`}><b>{court.name.slice(-2)}</b><span>{index === 0 ? "Green lane" : "Blue lane"}</span></div>{slots.slice(0, 4).map((slot, slotIndex) => <button key={slot.time} className={slot.state === "busy" ? "busy" : slotIndex === 1 ? "chosen" : "free"} onClick={goBook}>{slot.state === "busy" ? "—" : slotIndex === 1 ? "OPEN" : ""}</button>)}</div>)}</div><div className="quick-court-mark" aria-hidden="true"><span /><i /></div></section>; }

function HomeView({ goBook }: { goBook: () => void }) {
  return <>
    <Hero onBook={goBook} />
    <QuickCourtPreview goBook={goBook} />
    <section className="intro-section">
      <div className="intro-tag">BASELINE / A NEW KIND OF CLUB</div>
      <div className="intro-grid"><h2>More court time.<br /><span>Less admin.</span></h2><div><p>Pickleball is better when getting on court is effortless. Baseline is built around the rhythm of the game: clear lanes, quick decisions, and a club that knows when to get out of the way.</p><button className="underlined-link" onClick={goBook}>Find your next game <ArrowRight size={15} /></button></div></div>
      <div className="feature-strip"><div className="feature-image court-photo" /><div className="feature-copy"><div className="eyebrow">THE COURTS</div><h3>Made for the<br /><em>long rally.</em></h3><p>Pro-grade surface, tournament lighting, and enough room to make your third shot count.</p><span className="feature-index">01 — 03</span></div><div className="feature-stat"><strong>4</strong><span>indoor courts<br />in one club</span></div></div>
    </section>
    <section className="club-values"><div className="eyebrow">WHY BASELINE</div><h2>Good games<br /><em>start here.</em></h2><div className="value-grid"><div><span>01</span><h3>Book in a minute</h3><p>No calls, no waiting. See exactly what’s open and lock it in.</p></div><div><span>02</span><h3>Play your way</h3><p>Bring your crew, join open play, or get some reps in solo.</p></div><div><span>03</span><h3>Stay for the rally</h3><p>Rackets, refreshments, and good energy are always on hand.</p></div></div></section>
    <section className="community-band"><div className="community-photo" /><div className="community-copy"><div className="eyebrow light">THE CLUBHOUSE</div><h2>Come for the court.<br /><em>Stay for the people.</em></h2><p>A little competitive, never intimidating. Baseline is where Cebu comes to play.</p><button className="outline-light" onClick={() => toast("Clubhouse tour request noted")}>Meet the club <ArrowRight size={16} /></button></div></section>
    <footer className="public-footer"><div className="wordmark"><Mark dark /><span>baseline</span></div><span>Indoor pickleball, Cebu City</span><span>hello@baseline.ph</span><span>© 2024 Baseline Pickle Club</span></footer>
  </>;
}

function BookingFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1);
  const steps = ["Select", "Details", "Confirm"];
  return <main className="flow-page"><div className="flow-top"><button className="back-link" onClick={onBack}><ChevronLeft size={16} /> Back to courts</button><div className="stepper">{steps.map((label, i) => <div key={label} className={`step ${step >= i + 1 ? "done" : ""}`}><span>{i + 1}</span>{label}</div>)}</div><span className="secure-note"><ShieldCheck size={14} /> Secure booking</span></div><div className="flow-layout"><div className="flow-main">{step === 1 && <><div className="eyebrow">SELECT YOUR SESSION</div><h1>Make it a<br /><em>good one.</em></h1><div className="selection-card"><div className="mini-court-diagram"><span /><i /></div><div><span className="summary-label">YOUR PICK</span><h3>Court 02</h3><p>Wednesday, 24 April · 8:00 – 9:00 AM</p><span className="price">₱450 <small>per hour</small></span></div><button className="edit-button" onClick={onBack}>Edit</button></div><button className="dark-button wide" onClick={() => setStep(2)}>Continue to details <ArrowRight size={16} /></button></>}{step === 2 && <><div className="eyebrow">YOUR DETAILS</div><h1>Who’s<br /><em>playing?</em></h1><div className="form-grid"><label>Full name<input placeholder="Alex dela Cruz" /></label><label>Email address<input placeholder="alex@example.com" type="email" /></label><label>Phone number<input placeholder="+63 917 000 0000" /></label><label>Players<select defaultValue="2"><option value="2">2 players</option><option value="4">4 players</option></select></label></div><button className="dark-button wide" onClick={() => setStep(3)}>Review booking <ArrowRight size={16} /></button></>}{step === 3 && <><div className="eyebrow">ALMOST THERE</div><h1>Lock in<br /><em>your game.</em></h1><div className="confirm-card"><div><span className="summary-label">COURT 02 / WED 24 APRIL</span><h3>8:00 – 9:00 AM</h3><p>Indoor tournament surface · 2 players</p></div><strong>₱450</strong></div><label className="check-row"><input type="checkbox" defaultChecked /> I agree to the 12-hour cancellation policy.</label><button className="lime-button wide" onClick={() => toast("Booking confirmed — see you on court!")}>Confirm booking <ArrowRight size={16} /></button></>}</div><aside className="flow-aside"><div className="aside-court"><div className="mini-court-diagram large"><span /><i /></div></div><div className="aside-detail"><span className="summary-label">BASELINE PICKLE CLUB</span><h3>Great choice.</h3><p>Your court is held for 10 minutes while you finish booking.</p><div className="aside-total"><span>Total</span><strong>₱450</strong></div></div></aside></div></main>;
}

function AccountView() { return <main className="account-page"><div className="account-header"><div><div className="eyebrow">MEMBER AREA</div><h1>Hey, Alex.</h1><p>Your next good game is already on the calendar.</p></div><button className="dark-button" onClick={() => toast("Profile settings opened")}>Account settings <Settings2 size={16} /></button></div><div className="upcoming-card"><div className="upcoming-top"><span className="status-pill">UPCOMING</span><span>Booking #BL-240424-02</span></div><div className="upcoming-content"><div><span className="summary-label">WEDNESDAY, 24 APRIL 2024</span><h2>Court 02</h2><p>8:00 – 9:00 AM · 2 players</p></div><div className="upcoming-actions"><button className="outline-button" onClick={() => toast("Reschedule options opened")}>Reschedule</button><button className="quiet-button" onClick={() => toast("Cancellation policy shown")}>Cancel booking</button></div></div></div><div className="account-columns"><section><div className="section-title"><h2>Past bookings</h2><button className="underlined-link">View all <ArrowRight size={14} /></button></div>{["Court 01 · 18 April", "Court 03 · 11 April", "Court 02 · 04 April"].map((item, i) => <div className="history-row" key={item}><div className="history-icon"><CalendarDays size={17} /></div><div><strong>{item}</strong><span>60 minutes · ₱450</span></div><span className="history-status">Completed</span></div>)}</section><aside className="member-card"><Sparkles size={18} /><span>MEMBER SINCE 2023</span><strong>Keep your<br />rally going.</strong><button onClick={() => toast("Invite link copied")}>Invite a friend <ArrowRight size={14} /></button></aside></div></main>; }

function AdminShell({ view, setView, children, exit }: { view: AdminView; setView: (v: AdminView) => void; children: React.ReactNode; exit: () => void }) { const nav = [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }, { id: "schedule", label: "Schedule", icon: CalendarDays }, { id: "resources", label: "Resources", icon: Trophy }, { id: "customers", label: "Customers", icon: Users }, { id: "settings", label: "Settings", icon: Settings2 }] as const; return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><Mark /><span>baseline <small>club ops</small></span></div><div className="sidebar-label">WORKSPACE</div><nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon size={17} />{label}</button>)}</nav><div className="sidebar-bottom"><div className="admin-user"><span>AC</span><div><strong>Alex Cruz</strong><small>Owner</small></div><MoreHorizontal size={16} /></div><button className="exit-admin" onClick={exit}><ChevronLeft size={14} /> View public site</button></div></aside><main className="admin-content">{children}</main></div>; }

function AdminDashboard({ setView }: { setView: (v: AdminView) => void }) { return <><div className="admin-topbar"><div><span className="admin-breadcrumb">WORKSPACE / OVERVIEW</span><h1>Good morning, Alex.</h1></div><div className="admin-actions"><button className="outline-button" onClick={() => toast("Date picker opened")}>Today · 24 Apr <ChevronDown size={15} /></button><button className="lime-button" onClick={() => setView("schedule")}><Plus size={16} /> Add booking</button></div></div><div className="kpi-grid"><div className="kpi-card accent"><span>BOOKINGS TODAY</span><strong>24</strong><small>↑ 12% vs last Wednesday</small><div className="spark-bars">{[35,50,42,67,55,78,62,92,80,100].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div><div className="kpi-card"><span>REVENUE THIS WEEK</span><strong>₱48,240</strong><small className="positive">↑ 8.4% vs last week</small></div><div className="kpi-card"><span>COURT UTILIZATION</span><strong>76<span>%</span></strong><small>Peak hours: 6–9 PM</small><div className="utilization"><i /></div></div><div className="kpi-card"><span>ACTIVE MEMBERS</span><strong>318</strong><small>14 new this month</small></div></div><div className="dashboard-grid"><section className="ops-card"><div className="card-heading"><div><span className="admin-breadcrumb">LIVE SCHEDULE</span><h2>Today on court</h2></div><button className="underlined-link" onClick={() => setView("schedule")}>Full schedule <ArrowRight size={14} /></button></div><div className="ops-list">{[{time:"08:00", court:"Court 02", name:"Alex dela Cruz", type:"Member booking", color:"lime"},{time:"09:00", court:"Court 01", name:"Mia Santos", type:"Member booking", color:"blue"},{time:"10:00", court:"Court 03", name:"Open play session", type:"12 spots · 8 booked", color:"yellow"},{time:"11:00", court:"Court 04", name:"Available", type:"No booking yet", color:"muted"}].map(item => <div className="ops-row" key={item.time}><span className="ops-time">{item.time}</span><span className={`ops-dot ${item.color}`} /><div><strong>{item.court}</strong><span>{item.name} · {item.type}</span></div><button className="row-more" onClick={() => toast("Booking actions opened")}><MoreHorizontal size={16} /></button></div>)}</div></section><aside className="insight-card"><div className="insight-orbit"><Gauge size={24} /></div><span className="admin-breadcrumb">WEEKLY INSIGHT</span><h2>Friday is your<br /><em>power hour.</em></h2><p>Courts are 94% full between 6–8 PM. Consider opening a second open-play session.</p><button className="outline-light" onClick={() => toast("Insight saved")}>Save insight <ArrowRight size={14} /></button></aside></div></>; }

function ScheduleView() { return <><div className="admin-topbar"><div><span className="admin-breadcrumb">WORKSPACE / SCHEDULE</span><h1>Schedule</h1></div><div className="admin-actions"><button className="outline-button"><ChevronLeft size={15} /></button><button className="outline-button">Wed, 24 Apr <ChevronDown size={15} /></button><button className="outline-button"><ChevronRight size={15} /></button><button className="lime-button" onClick={() => toast("New booking form opened")}><Plus size={16} /> Add booking</button></div></div><div className="schedule-card"><div className="schedule-head"><div><span className="admin-breadcrumb">WEDNESDAY, 24 APRIL</span><h2>All courts</h2></div><div className="legend"><span><i className="legend-open" /> Available</span><span><i className="legend-busy" /> Booked</span><span><i className="legend-selected" /> Open play</span></div></div><div className="schedule-grid"><div className="schedule-times"><span /><span>6 AM</span><span>8 AM</span><span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span><span>8 PM</span></div>{courts.map((court, idx) => <div className="schedule-row" key={court.name}><div className="schedule-label"><strong>{court.name}</strong><small>{idx % 2 ? "Blue" : "Green"} lane</small></div><div className="schedule-cells">{[0,1,2,3,4,5,6,7].map((_, i) => <button key={i} className={(i + idx) % 4 === 0 ? "booked" : (i === 5 ? "open-play" : "free")} onClick={() => toast("Slot actions opened")}><span>{(i + idx) % 4 === 0 ? "BOOKED" : i === 5 ? "OPEN PLAY" : ""}</span></button>)}</div></div>)}</div></div></>; }

function SimpleAdmin({ kind }: { kind: Exclude<AdminView, "dashboard" | "schedule"> }) { const titles: Record<Exclude<AdminView, "dashboard" | "schedule">, readonly [string, string, string]> = { resources: ["Resources", "Four courts, one clear view.", "COURT INVENTORY"], customers: ["Customers", "Know who’s on court.", "MEMBER DIRECTORY"], settings: ["Settings", "Make the rules clear.", "CLUB SETTINGS"] }; const [title, sub, label] = titles[kind]; return <><div className="admin-topbar"><div><span className="admin-breadcrumb">WORKSPACE / {label}</span><h1>{title}</h1></div><button className="lime-button" onClick={() => toast(`${title} action opened`)}><Plus size={16} /> Add {kind === "resources" ? "resource" : kind === "customers" ? "member" : "rule"}</button></div><div className="simple-admin-intro"><div><div className="eyebrow">{label}</div><h2>{sub}</h2><p>This reusable core view is ready to connect to your Supabase data model. The pickleball skin supplies the court names, surface labels, and club vocabulary.</p></div><div className="simple-number">{kind === "resources" ? "04" : kind === "customers" ? "318" : "12h"}<small>{kind === "resources" ? "bookable courts" : kind === "customers" ? "active members" : "cancellation window"}</small></div></div><div className="table-card"><div className="table-toolbar"><input placeholder={`Search ${title.toLowerCase()}…`} /><button className="outline-button">Filter <ChevronDown size={15} /></button></div>{(kind === "resources" ? courts.map(c => [c.name, c.meta, c.price, "Active"]) : kind === "customers" ? [["Alex dela Cruz", "alex@example.com", "24 bookings", "Member"],["Mia Santos", "mia@example.com", "12 bookings", "Member"],["Jon Bell", "jon@example.com", "3 bookings", "New member"]] : [["Opening hours", "Mon–Sun · 06:00–22:00", "", "Active"],["Cancellation policy", "12 hours before start", "", "Active"],["Blackout dates", "No blackout dates", "", "Clear"]]).map((row, i) => <div className="table-row" key={i}>{row.map((cell, j) => <span key={j} className={j === row.length - 1 ? "row-badge" : j === 0 ? "row-primary" : ""}>{cell}</span>)}<button className="row-more"><MoreHorizontal size={16} /></button></div>)}</div></>; }

export default function Home() {
  const [mode, setMode] = useState<Mode>("public");
  const [view, setView] = useState<PublicView>("home");
  const [adminView, setAdminView] = useState<AdminView>("dashboard");
  const goBook = () => setView("book");
  if (mode === "admin") return <AdminShell view={adminView} setView={setAdminView} exit={() => setMode("public")}>{adminView === "dashboard" ? <AdminDashboard setView={setAdminView} /> : adminView === "schedule" ? <ScheduleView /> : <SimpleAdmin kind={adminView} />}</AdminShell>;
  return <div className="public-shell"><PublicHeader view={view} setView={setView} onAdmin={() => setMode("admin")} /><div className="admin-switch"><button onClick={() => setMode("admin")}><LayoutDashboard size={14} /> Open club ops</button></div>{view === "home" && <HomeView goBook={goBook} />}{view === "book" && <><BookingBoard onConfirm={() => setView("book")} /><BookingFlow onBack={() => setView("home")} /></>}{view === "account" && <AccountView />}</div>;
}
