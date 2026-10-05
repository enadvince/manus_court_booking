/* Baseline Pickle Club skin: court-first geometry, court green + ball yellow, Space Grotesk/DM Sans, editorial asymmetric rhythm. Core system: shell, lanes, stepper, account/admin views. Skin: pickleball vocabulary, court diagrams, racket add-on. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CircleAlert,
  Copy,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Crown,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { dashboardAttention, dashboardBookings, getDashboardSummary, revenuePulse } from "@/lib/adminDashboard";
import { copyText } from "@/lib/clipboard";
import { openExternal } from "@/lib/external";
import { NAVIGATE_EVENT, targetToUrl, urlToTarget, type AdminView, type PublicView, type SiteTarget } from "@/lib/navigation";
import { contact, posts } from "@/lib/siteContent";
import { CodeBlock } from "@/components/site/CodeBlock";
import { FaqSection, NewsletterSignup, NewsView, PostDates } from "@/components/site/ContentSections";
import { ConfirmDialog, SignInDialog } from "@/components/site/Dialogs";
import { MobileMenu } from "@/components/site/MobileMenu";
import { openSearch } from "@/components/site/SiteSearch";
import { FloatingContact, MAIN_ID } from "@/components/site/SiteChrome";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { scrollBehavior, useScrolled } from "@/components/site/hooks";

type Mode = "public" | "admin";

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

function createGoogleCalendarUrl({ title, details, location, start, end }: { title: string; details: string; location: string; start: string; end: string }) {
  const params = new URLSearchParams({ action: "TEMPLATE", text: title, details, location, dates: `${start}/${end}` });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function addToGoogleCalendar(event: { title: string; details: string; location: string; start: string; end: string }) {
  openExternal(createGoogleCalendarUrl(event));
  toast("Google Calendar opened with your event details");
}

function CapacityMeter({ joined, max, label = "players joined" }: { joined: number; max: number; label?: string }) {
  const percentage = Math.min(100, Math.round((joined / max) * 100));
  return <div className="capacity-meter"><div className="capacity-heading"><span><Users size={14} /> {label}</span><strong>{joined} <small>/ {max}</small></strong></div><div className="capacity-track"><i style={{ width: `${percentage}%` }} /></div><span className="capacity-note">{joined >= max ? "Session full" : `${max - joined} spot${max - joined === 1 ? "" : "s"} open · host max ${max}`}</span></div>;
}

function Mark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`brand-mark ${dark ? "brand-mark-dark" : ""}`} aria-hidden="true">
      <span />
    </span>
  );
}

function PublicHeader({ view, setView, onAdmin, onOpenPlay, onSignIn }: { view: PublicView; setView: (view: PublicView) => void; onAdmin: () => void; onOpenPlay: () => void; onSignIn: () => void }) {
  const scrolled = useScrolled(8);
  const navItems: { id: PublicView; label: string }[] = [{ id: "home", label: "Club" }, { id: "book", label: "Book a court" }, { id: "news", label: "News" }, { id: "account", label: "My bookings" }];
  return (
    <header className={`public-header ${scrolled ? "is-scrolled" : ""}`}>
      <button className="wordmark" onClick={() => setView("home")} aria-label="Baseline Pickle Club home">
        <Mark /> <span>baseline</span>
      </button>
      <nav className="public-nav" aria-label="Public navigation">
        {navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} aria-current={view === item.id ? "page" : undefined} onClick={() => setView(item.id)}>{item.label}</button>)}
      </nav>
      <div className="header-actions">
        <button className={`text-button desktop-only ${view === "openplay" ? "active" : ""}`} aria-current={view === "openplay" ? "page" : undefined} onClick={onOpenPlay}>Open Play</button><button className="text-button desktop-only" onClick={onAdmin}>Club ops</button><button className="text-button desktop-only" onClick={onSignIn}>Sign in</button>
        <button className="icon-button search-trigger" onClick={openSearch} aria-label="Search the site (press /)" title="Search (/ or Ctrl K)"><Search size={18} /></button>
        <ThemeToggle className="icon-button desktop-only" />
        <button className="pill-button" onClick={() => setView("book")}>Book now <ArrowRight size={15} /></button>
        <MobileMenu view={view} onNavigate={setView} onAdmin={onAdmin} onSignIn={onSignIn} onSearch={openSearch} />
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

function BookingBoard({ onConfirm }: { onConfirm: (court: string, maxPlayers: number) => void }) {
  const [selected, setSelected] = useState<string | null>("Court 02-08:00");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const joinedPlayers = 2;
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
      <div className="booking-summary"><div><span className="summary-label">YOUR SESSION</span><strong>{selectedLabel}</strong><small>60 minutes · Tournament surface</small></div><div className="booking-capacity"><label>PLAYER CAP</label><select value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} aria-label="Maximum players for this session"><option value={2}>2 players</option><option value={4}>4 players</option><option value={6}>6 players</option><option value={8}>8 players</option></select><CapacityMeter joined={joinedPlayers} max={maxPlayers} /></div><button className="dark-button" disabled={joinedPlayers >= maxPlayers} onClick={() => onConfirm(selected || "Court 02-08:00", maxPlayers)}>{joinedPlayers >= maxPlayers ? "Session full" : "Continue"} <ArrowRight size={16} /></button></div>
    </section>
  );
}

function QuickCourtPreview({ goBook }: { goBook: () => void }) { return <section className="quick-board"><div className="quick-board-copy"><div className="eyebrow">RIGHT NOW / WED 24 APR</div><h2>See the open<br /><span>lanes.</span></h2><p>Choose a time, choose a court, and get straight to the good part.</p><button className="underlined-link" onClick={goBook}>Show me the full board <ArrowRight size={15} /></button></div><div className="quick-lanes"><div className="quick-lane-header"><span>COURT</span><span>06:00</span><span>08:00</span><span>10:00</span><span>12:00</span></div>{courts.slice(0, 2).map((court, index) => <div className="quick-lane" key={court.name}><div className={`quick-court-label ${court.tone}`}><b>{court.name.slice(-2)}</b><span>{index === 0 ? "Green lane" : "Blue lane"}</span></div>{slots.slice(0, 4).map((slot, slotIndex) => <button key={slot.time} className={slot.state === "busy" ? "busy" : slotIndex === 1 ? "chosen" : "free"} disabled={slot.state === "busy"} aria-label={`${court.name} ${slot.time} ${slot.state === "busy" ? "booked" : "open"}`} onClick={goBook}>{slot.state === "busy" ? "—" : slotIndex === 1 ? "OPEN" : ""}</button>)}</div>)}</div><div className="quick-court-mark" aria-hidden="true"><span /><i /></div></section>; }

function HomeView({ goBook, go }: { goBook: () => void; go: (target: SiteTarget) => void }) {
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
    <section className="news-teaser" aria-labelledby="news-teaser-title"><div className="section-title"><div><div className="eyebrow">FROM THE CLUB</div><h2 id="news-teaser-title">Latest news</h2></div><button className="underlined-link" onClick={() => go({ area: "public", view: "news" })}>All news <ArrowRight size={14} /></button></div><div className="news-teaser-grid">{posts.map((post) => <article key={post.id} className="news-card"><h3>{post.title}</h3><p>{post.excerpt}</p><PostDates post={post} /><button className="underlined-link" onClick={() => go({ area: "public", view: "news", anchor: post.id })} aria-label={`Read: ${post.title}`}>Read post <ArrowRight size={14} /></button></article>)}</div></section>
    <FaqSection />
    <NewsletterSignup />
    <PublicFooter go={go} />
  </>;
}

function PublicFooter({ go }: { go: (target: SiteTarget) => void }) {
  return <footer className="public-footer"><div className="wordmark"><Mark dark /><span>baseline</span></div><span>Indoor pickleball, Cebu City</span><a href={`mailto:${contact.email}`}>{contact.email}</a><a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">Directions<span className="sr-only"> (opens Google Maps in a new tab)</span></a><button className="footer-link" onClick={() => go({ area: "public", view: "news" })}>News</button><span>© {new Date().getFullYear()} Baseline Pickle Club</span><span className="footer-credit">Developed by WaddleLabs</span></footer>;
}

function BookingFlow({ onBack, maxPlayers = 4 }: { onBack: () => void; maxPlayers?: number }) {
  const [step, setStep] = useState<number>(1);
  const [confirming, setConfirming] = useState(false);
  const confirmBooking = async () => { setConfirming(true); await new Promise((resolve) => setTimeout(resolve, 700)); setConfirming(false); toast("Booking confirmed — choose your calendar next"); setStep(4); };
  const steps = ["Select", "Details", "Confirm"];
  const calendarEvent = { title: "Baseline Pickle Club · Court 02", details: `Court booking with ${maxPlayers} player capacity.`, location: "Baseline Pickle Club, Cebu City", start: "20240424T080000", end: "20240424T090000" };
  return <div className="flow-page"><div className="flow-top"><button className="back-link" onClick={onBack}><ChevronLeft size={16} /> Back to courts</button><div className="stepper">{steps.map((label, i) => <div key={label} className={`step ${step >= i + 1 ? "done" : ""}`}><span>{i + 1}</span>{label}</div>)}</div><span className="secure-note"><ShieldCheck size={14} /> Secure booking</span></div><div className="flow-layout"><div className="flow-main">{step === 1 && <><div className="eyebrow">SELECT YOUR SESSION</div><h1>Make it a<br /><em>good one.</em></h1><div className="selection-card"><div className="mini-court-diagram"><span /><i /></div><div><span className="summary-label">YOUR PICK</span><h3>Court 02</h3><p>Wednesday, 24 April · 8:00 – 9:00 AM</p><span className="price">₱450 <small>per hour</small></span></div><button className="edit-button" onClick={onBack}>Edit</button></div><button className="dark-button wide" onClick={() => setStep(2)}>Continue to details <ArrowRight size={16} /></button></>}{step === 2 && <><div className="eyebrow">YOUR DETAILS</div><h1>Who’s<br /><em>playing?</em></h1><div className="form-grid"><label>Full name<input placeholder="Alex dela Cruz" /></label><label>Email address<input placeholder="alex@example.com" type="email" /></label><label>Phone number<input placeholder="+63 917 000 0000" /></label><label>Players<select value={maxPlayers} disabled aria-label="Maximum players for this session"><option value={2}>2 players</option><option value={4}>4 players</option><option value={6}>6 players</option><option value={8}>8 players</option></select></label></div><button className="dark-button wide" onClick={() => setStep(3)}>Review booking <ArrowRight size={16} /></button></>}{step === 3 && <><div className="eyebrow">ALMOST THERE</div><h1>Lock in<br /><em>your game.</em></h1><div className="confirm-card"><div><span className="summary-label">COURT 02 / WED 24 APRIL</span><h3>8:00 – 9:00 AM</h3><p>Indoor tournament surface · {maxPlayers} player capacity · 2 joined</p><CapacityMeter joined={2} max={maxPlayers} /></div><strong>₱450</strong></div><label className="check-row"><input type="checkbox" defaultChecked /> I agree to the 12-hour cancellation policy.</label><button className="lime-button wide" disabled={confirming} onClick={confirmBooking}>{confirming ? <><span className="spinner" aria-hidden="true" /> Confirming…</> : <><CalendarPlus size={16} /> Confirm booking <ArrowRight size={16} /></>}</button></>}{step === 4 && <><div className="eyebrow">BOOKING CONFIRMED</div><h1>See you<br /><em>on court.</em></h1><div className="calendar-success"><CalendarDays size={21} /><div><strong>Your Court 02 session is locked in.</strong><span>Add it to Google Calendar so the court, time, and capacity stay on your schedule.</span></div></div><div className="calendar-action-row"><button className="lime-button" onClick={() => addToGoogleCalendar(calendarEvent)}><CalendarPlus size={16} /> Add to Google Calendar</button><button className="outline-button" onClick={onBack}>Book another court</button></div></>}</div><aside className="flow-aside"><div className="aside-court"><div className="mini-court-diagram large"><span /><i /></div></div><div className="aside-detail"><span className="summary-label">BASELINE PICKLE CLUB</span><h3>{step === 4 ? "You’re on the list." : "Great choice."}</h3><p>{step === 4 ? "A calendar event keeps the game from getting lost in the shuffle." : "Your court is held for 10 minutes while you finish booking."}</p><div className="aside-total"><span>Total</span><strong>₱450</strong></div></div></aside></div></div>;
}

function AccountView({ goBook }: { goBook: () => void }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  return <div className="account-page"><div className="account-header"><div><div className="eyebrow">MEMBER AREA</div><h1>Hey, Alex.</h1><p>Your next good game is already on the calendar.</p></div><button className="dark-button" onClick={() => toast("Profile settings opened")}>Account settings <Settings2 size={16} /></button></div><div className={`upcoming-card ${cancelled ? "is-cancelled" : ""}`}><div className="upcoming-top"><span className="status-pill">{cancelled ? "CANCELLED" : "UPCOMING"}</span><span>Booking #BL-240424-02</span></div><div className="upcoming-content"><div><span className="summary-label">WEDNESDAY, 24 APRIL 2024</span><h2>Court 02</h2><p>8:00 – 9:00 AM · 2 players</p></div>{cancelled ? <div className="upcoming-actions"><button className="outline-button" onClick={goBook}>Book another court</button></div> : <div className="upcoming-actions"><button className="outline-button" onClick={() => toast("Reschedule options opened")}>Reschedule</button><button className="outline-button calendar-small" onClick={() => addToGoogleCalendar({ title: "Baseline Pickle Club · Court 02", details: "Court booking · 2 players joined.", location: "Baseline Pickle Club, Cebu City", start: "20240424T080000", end: "20240424T090000" })}><CalendarPlus size={14} /> Calendar</button><button className="quiet-button" onClick={() => setConfirmCancel(true)}>Cancel booking</button></div>}</div></div><div className="account-columns"><section><div className="section-title"><h2>Past bookings</h2><button className="underlined-link">View all <ArrowRight size={14} /></button></div>{["Court 01 · 18 April", "Court 03 · 11 April", "Court 02 · 04 April"].map((item, i) => <div className="history-row" key={item}><div className="history-icon"><CalendarDays size={17} /></div><div><strong>{item}</strong><span>60 minutes · ₱450</span></div><span className="history-status">Completed</span></div>)}</section><aside className="member-card"><Sparkles size={18} /><span>MEMBER SINCE 2023</span><strong>Keep your<br />rally going.</strong><button onClick={async () => toast((await copyText(`${window.location.origin}/?view=book`)) ? "Invite link copied" : "Couldn’t copy the invite link")}>Invite a friend <Copy size={14} /></button></aside></div><ConfirmDialog open={confirmCancel} onOpenChange={setConfirmCancel} title="Cancel your Court 02 booking?" description="Wednesday, 24 April · 8:00 – 9:00 AM. Cancelling frees the court for other players and can’t be undone. Cancellations inside 12 hours of the start aren’t refunded." confirmLabel="Cancel booking" cancelLabel="Keep booking" onConfirm={() => { setCancelled(true); toast("Booking cancelled. Court 02 is back on the board."); }} /></div>;
}

type OpenPlayRole = "host" | "participant";
type OpenPlayPlayer = { name: string; level: string; games: number; wait: number; joined: string; you?: boolean };

const openPlayPlayers: OpenPlayPlayer[] = [
  { name: "Alex dela Cruz", level: "3.5", games: 1, wait: 0, joined: "6:05 PM" },
  { name: "Mia Santos", level: "3.0", games: 1, wait: 2, joined: "6:08 PM" },
  { name: "Jon Bell", level: "3.5", games: 0, wait: 8, joined: "6:02 PM" },
  { name: "Camille Reyes", level: "4.0", games: 1, wait: 3, joined: "6:12 PM" },
  { name: "Paolo Lim", level: "3.0", games: 0, wait: 11, joined: "6:15 PM" },
  { name: "Nina Garcia", level: "3.5", games: 0, wait: 7, joined: "6:18 PM" },
  { name: "Rafael Tan", level: "4.0", games: 1, wait: 4, joined: "6:20 PM" },
  { name: "Bea Navarro", level: "3.0", games: 0, wait: 9, joined: "6:22 PM" },
];

function OpenPlayRoleToggle({ role, setRole }: { role: OpenPlayRole; setRole: (role: OpenPlayRole) => void }) {
  return <div className="role-toggle" role="radiogroup" aria-label="Open play view">{([["host", "Host mode", Crown], ["participant", "Participant view", Users]] as const).map(([id, label, Icon]) => <button key={id} role="radio" aria-checked={role === id} className={role === id ? "active" : ""} onClick={() => setRole(id)}><Icon size={14} /> {label}</button>)}</div>;
}

function OpenPlayView({ onBack }: { onBack: () => void }) {
  const [role, setRoleState] = useState<OpenPlayRole>(() => new URLSearchParams(window.location.search).get("role") === "participant" ? "participant" : "host");
  const [rotationVersion, setRotationVersion] = useState(0);
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [hasJoined, setHasJoined] = useState(false);
  const setRole = (next: OpenPlayRole) => {
    setRoleState(next);
    const url = new URL(window.location.href);
    if (next === "participant") url.searchParams.set("role", "participant"); else url.searchParams.delete("role");
    window.history.replaceState(null, "", url);
  };
  const players = useMemo(() => hasJoined ? [...openPlayPlayers, { name: "You", level: "3.5", games: 0, wait: 0, joined: "now", you: true }] : openPlayPlayers, [hasJoined]);
  const queue = useMemo(() => [...players].sort((a, b) => a.games - b.games || b.wait - a.wait || ((players.indexOf(a) + rotationVersion) % players.length) - ((players.indexOf(b) + rotationVersion) % players.length)), [players, rotationVersion]);
  const joined = players.length;
  const isHost = role === "host";
  const yourPosition = queue.findIndex((player) => player.you) + 1;
  const isFull = joined >= maxPlayers;
  const toggleJoin = () => {
    if (hasJoined) { setHasJoined(false); toast("You left the open play queue"); return; }
    if (isFull) { toast("This session is full"); return; }
    setHasJoined(true);
    toast("You're in! Watch the queue for your next game");
  };
  const participantPanel = <aside className="host-tools participant-tools"><div className="eyebrow light">YOUR SPOT</div>{hasJoined ? <><h2>{yourPosition <= 4 ? <>You’re up<br /><em>next game.</em></> : <>#{yourPosition}<br /><em>in line.</em></>}</h2><div className="host-stat"><strong>{Math.max(0, Math.ceil(yourPosition / 4) - 1)}</strong><span>games before you play</span></div><div className="host-stat"><strong>0</strong><span>games played tonight</span></div><button className="outline-light" onClick={toggleJoin}>Leave queue <X size={14} /></button></> : <><h2>Grab a<br /><em>paddle.</em></h2><div className="host-stat"><strong>{Math.max(0, maxPlayers - joined)}</strong><span>spots still open</span></div><div className="host-stat"><strong>4</strong><span>players per game</span></div><button className="lime-button participant-join" disabled={isFull} onClick={toggleJoin}>{isFull ? "Session full" : <>Join open play <ArrowRight size={14} /></>}</button></>}</aside>;
  const hostPanel = <aside className="host-tools"><div className="eyebrow light">HOST TOOLKIT</div><h2>More play.<br /><em>Less waiting.</em></h2><div className="host-stat"><strong>4</strong><span>players per game</span></div><div className="host-stat"><strong>11m</strong><span>longest current rest</span></div><button className="outline-light" onClick={() => toast("Current game marked complete; queue advanced")}>Complete current game <ArrowRight size={14} /></button></aside>;
  return <div className={`openplay-page ${isHost ? "is-host" : "is-participant"}`}><div className="openplay-top"><button className="back-link" onClick={onBack}><ChevronLeft size={16} /> Back to club</button><OpenPlayRoleToggle role={role} setRole={setRole} /><button className="outline-button" onClick={() => addToGoogleCalendar({ title: "Baseline Open Play · Wednesday", details: isHost ? "Hosted open play session. Rotation order is managed for equal rest time." : "Open play session. The host rotates players so everyone gets equal court time.", location: "Baseline Pickle Club, Cebu City", start: "20240424T180000", end: "20240424T200000" })}><CalendarPlus size={15} /> Add session to Google Calendar</button></div><div className="openplay-hero"><div><div className="eyebrow">{isHost ? "OPEN PLAY HOST MODE" : "OPEN PLAY"} · WEDNESDAY · 6:00–8:00 PM · COURT 03</div><h1>{isHost ? <>Keep the rally<br /><em>moving.</em></> : <>Play more.<br /><em>Wait less.</em></>}</h1><p>{isHost ? "Run an open play where every player gets the most court time with the least waiting. The queue favors players with fewer games and longer rest first." : "Join the session and see exactly where you stand. The host rotates players fairly, so fewer games and longer rest always move you up."}</p></div><div className="openplay-capacity"><span className="summary-label">SESSION CAPACITY</span><strong>{joined} <small>/ {maxPlayers}</small></strong><CapacityMeter joined={joined} max={maxPlayers} label="players joined" />{isHost ? <label>Host max<select value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))}><option value={8}>8 players</option><option value={12}>12 players</option><option value={16}>16 players</option></select></label> : <label>Max players<span className="capacity-readonly">{maxPlayers} players</span></label>}</div></div><div className="openplay-grid"><section className="rotation-card"><div className="rotation-heading"><div><span className="eyebrow">FAIR ROTATION ORDER</span><h2>Who plays next.</h2></div>{isHost && <button className="lime-button" onClick={() => { setRotationVersion((version) => version + 1); toast("Rotation rebalanced for equal rest time"); }}><RefreshCw size={15} /> Rebalance queue</button>}</div><p className="rotation-note"><Crown size={15} /> {isHost ? "Priority is calculated from games played, then minutes waiting. No one gets stuck on the sideline." : "The host manages this queue. Fewer games and longer rest move players up — no one gets stuck on the sideline."}</p><div className="rotation-list">{queue.map((player, index) => <div className={`rotation-row ${player.you ? "is-you" : ""}`} key={player.name}><span className="rotation-rank">{index + 1}</span><div className="player-avatar">{player.you ? "ME" : player.name.split(" ").map((part) => part[0]).join("")}</div><div className="rotation-player"><strong>{player.name}</strong><span>Level {player.level} · joined {player.joined}</span></div><div className="player-games"><strong>{player.games}</strong><span>games</span></div><div className="player-wait"><strong>{player.wait}m</strong><span>rest</span></div><span className={`play-next ${index < 4 ? "next" : "queued"}`}>{index < 4 ? "NEXT GAME" : "IN QUEUE"}</span></div>)}</div></section>{isHost ? hostPanel : participantPanel}</div><div className="fairness-explainer"><div><span className="eyebrow">HOW THE QUEUE WORKS</span><h2>Equal turns, by design.</h2></div><div className="fairness-steps"><span><b>01</b> Fewer games move first.</span><span><b>02</b> Longer rest breaks ties.</span><span><b>03</b> Host advances the next four.</span></div></div></div>;
}

function AdminShell({ view, setView, children, exit }: { view: AdminView; setView: (v: AdminView) => void; children: React.ReactNode; exit: () => void }) { const nav = [{ id: "dashboard", label: "Overview", icon: LayoutDashboard }, { id: "schedule", label: "Schedule", icon: CalendarDays }, { id: "resources", label: "Resources", icon: Trophy }, { id: "customers", label: "Customers", icon: Users }, { id: "settings", label: "Settings", icon: Settings2 }] as const; return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand"><Mark /><span>baseline <small>club ops</small></span></div><div className="sidebar-label">WORKSPACE</div><nav aria-label="Club ops">{nav.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} aria-label={label} onClick={() => setView(id)}><Icon size={17} />{label}</button>)}</nav><div className="sidebar-bottom"><div className="admin-user"><span>AC</span><div><strong>Alex Cruz</strong><small>Owner</small></div><MoreHorizontal size={16} /></div><div className="admin-tools"><button className="exit-admin" onClick={openSearch} aria-label="Search the site"><Search size={14} /><span>Search</span></button><ThemeToggle className="exit-admin" /></div><button className="exit-admin" onClick={exit} aria-label="View public site"><ChevronLeft size={14} /><span>View public site</span></button></div></aside><main className="admin-content" id={MAIN_ID} tabIndex={-1}>{children}</main></div>; }

function AdminDashboard({ setView }: { setView: (v: AdminView) => void }) {
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState("Today · 24 Apr");
  const summary = getDashboardSummary(dashboardBookings);
  const visibleAttention = dashboardAttention.filter((item) => !completedItems.includes(item.id));
  const completeAttention = (id: string, title: string) => {
    setCompletedItems((items) => [...items, id]);
    toast(`${title} marked complete`);
  };

  return <>
    <div className="admin-topbar">
      <div><span className="admin-breadcrumb">WORKSPACE / OVERVIEW</span><h1>Good morning, Alex.</h1><p className="admin-subtitle">Here’s what needs your attention before the first evening rally.</p></div>
      <div className="admin-actions"><button className="outline-button" onClick={() => { setSelectedRange(selectedRange === "Today · 24 Apr" ? "Tomorrow · 25 Apr" : "Today · 24 Apr"); toast(`${selectedRange === "Today · 24 Apr" ? "Tomorrow" : "Today"} selected`); }}>{selectedRange} <ChevronDown size={15} /></button><button className="lime-button" onClick={() => setView("schedule")}><Plus size={16} /> Add booking</button></div>
    </div>

    <section className="ops-pulse" aria-label="Daily operations pulse">
      <div><span className="admin-breadcrumb">DAILY OPERATIONS PULSE</span><h2>{summary.confirmed + summary.openPlay} sessions on the board.</h2><p>{summary.available} court still open before lunch · evening peak starts at 6:00 PM</p></div>
      <div className="pulse-stat"><strong>76%</strong><span>utilization today</span><div className="pulse-track"><i /></div></div>
      <div className="pulse-stat"><strong>₱8,640</strong><span>expected today</span><div className="pulse-bars">{revenuePulse.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
    </section>

    <div className="kpi-grid">
      <div className="kpi-card accent"><span>BOOKINGS TODAY</span><strong>24</strong><small>↑ 12% vs last Wednesday</small><div className="spark-bars">{[35,50,42,67,55,78,62,92,80,100].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div></div>
      <div className="kpi-card"><span>REVENUE THIS WEEK</span><strong>₱48,240</strong><small className="positive">↑ 8.4% vs last week</small></div>
      <div className="kpi-card"><span>COURT UTILIZATION</span><strong>76<span>%</span></strong><small>Peak hours: 6–9 PM</small><div className="utilization"><i /></div></div>
      <div className="kpi-card"><span>ACTIVE MEMBERS</span><strong>318</strong><small>14 new this month</small></div>
    </div>

    <div className="dashboard-grid">
      <section className="ops-card"><div className="card-heading"><div><span className="admin-breadcrumb">LIVE SCHEDULE</span><h2>Today on court</h2></div><button className="underlined-link" onClick={() => setView("schedule")}>Full schedule <ArrowRight size={14} /></button></div><div className="ops-list">{dashboardBookings.map((item) => <div className="ops-row" key={item.time}><span className="ops-time">{item.time}</span><span className={`ops-dot ${item.color}`} /><div><strong>{item.court}</strong><span>{item.name} · {item.type}</span></div>{item.status === "available" ? <button className="row-action" onClick={() => setView("schedule")}>Fill slot <ArrowRight size={13} /></button> : <button className="row-more" onClick={() => toast(`${item.court} booking actions opened`)}><MoreHorizontal size={16} /></button>}</div>)}</div></section>
      <aside className="insight-card"><div className="insight-orbit"><Gauge size={24} /></div><span className="admin-breadcrumb">WEEKLY INSIGHT</span><h2>Friday is your<br /><em>power hour.</em></h2><p>Courts are 94% full between 6–8 PM. Consider opening a second open-play session.</p><button className="outline-light" onClick={() => toast("Insight saved")}>Save insight <ArrowRight size={14} /></button></aside>
    </div>

    <div className="dashboard-lower-grid">
      <section className="attention-card"><div className="card-heading"><div><span className="admin-breadcrumb">NEEDS ATTENTION</span><h2>Keep the floor moving.</h2></div><span className="attention-count">{visibleAttention.length} open</span></div>{visibleAttention.length === 0 ? <div className="attention-empty"><CheckCircle2 size={18} /><span>All clear. The club is ready for today.</span></div> : <div className="attention-list">{visibleAttention.map((item) => <div className="attention-row" key={item.id}><span className={`attention-icon ${item.tone}`}>{item.tone === "warning" ? <CircleAlert size={15} /> : item.tone === "info" ? <Wrench size={15} /> : <Users size={15} />}</span><div><strong>{item.title}</strong><span>{item.detail}</span></div><button className="quiet-button" onClick={() => completeAttention(item.id, item.title)}><CheckCircle2 size={15} /> Done</button></div>)}</div>}</section>
      <section className="quick-actions-card"><span className="admin-breadcrumb">QUICK ACTIONS</span><h2>Make the next move.</h2><div className="quick-actions-list"><button onClick={() => setView("schedule")}><Plus size={16} /><span><strong>Add booking</strong><small>Reserve a court for a member</small></span><ArrowRight size={14} /></button><button onClick={() => toast("Open play setup started")}><Sparkles size={16} /><span><strong>Start open play</strong><small>Set up a hosted session</small></span><ArrowRight size={14} /></button><button onClick={() => toast("Member message composer opened")}><MessageSquare size={16} /><span><strong>Message members</strong><small>Send an update to today’s players</small></span><ArrowRight size={14} /></button></div></section>
    </div>
  </>;
}
function ScheduleView() { return <><div className="admin-topbar"><div><span className="admin-breadcrumb">WORKSPACE / SCHEDULE</span><h1>Schedule</h1></div><div className="admin-actions"><button className="outline-button"><ChevronLeft size={15} /></button><button className="outline-button">Wed, 24 Apr <ChevronDown size={15} /></button><button className="outline-button"><ChevronRight size={15} /></button><button className="lime-button" onClick={() => toast("New booking form opened")}><Plus size={16} /> Add booking</button></div></div><div className="schedule-card"><div className="schedule-head"><div><span className="admin-breadcrumb">WEDNESDAY, 24 APRIL</span><h2>All courts</h2></div><div className="legend"><span><i className="legend-open" /> Available</span><span><i className="legend-busy" /> Booked</span><span><i className="legend-selected" /> Open play</span></div></div><div className="schedule-grid"><div className="schedule-times"><span /><span>6 AM</span><span>8 AM</span><span>10 AM</span><span>12 PM</span><span>2 PM</span><span>4 PM</span><span>6 PM</span><span>8 PM</span></div>{courts.map((court, idx) => <div className="schedule-row" key={court.name}><div className="schedule-label"><strong>{court.name}</strong><small>{idx % 2 ? "Blue" : "Green"} lane</small></div><div className="schedule-cells">{[0,1,2,3,4,5,6,7].map((_, i) => <button key={i} className={(i + idx) % 4 === 0 ? "booked" : (i === 5 ? "open-play" : "free")} onClick={() => toast("Slot actions opened")}><span>{(i + idx) % 4 === 0 ? "BOOKED" : i === 5 ? "OPEN PLAY" : ""}</span></button>)}</div></div>)}</div></div></>; }

function CustomerTable() {
  type Customer = { name: string; email: string; bookings: number; spend: number; lastVisit: string; status: "Member" | "New member" | "Inactive" };
  type SortKey = "name" | "bookings" | "spend" | "lastVisit" | "status";
  const customers: Customer[] = [
    { name: "Alex dela Cruz", email: "alex@example.com", bookings: 24, spend: 10800, lastVisit: "Today", status: "Member" },
    { name: "Mia Santos", email: "mia@example.com", bookings: 12, spend: 5400, lastVisit: "Yesterday", status: "Member" },
    { name: "Jon Bell", email: "jon@example.com", bookings: 3, spend: 1350, lastVisit: "18 Apr", status: "New member" },
    { name: "Camille Reyes", email: "camille@example.com", bookings: 18, spend: 8100, lastVisit: "17 Apr", status: "Member" },
    { name: "Paolo Lim", email: "paolo@example.com", bookings: 1, spend: 450, lastVisit: "12 Apr", status: "New member" },
    { name: "Nina Garcia", email: "nina@example.com", bookings: 0, spend: 0, lastVisit: "—", status: "Inactive" },
    { name: "Rafael Tan", email: "rafael@example.com", bookings: 9, spend: 4050, lastVisit: "10 Apr", status: "Member" },
    { name: "Bea Navarro", email: "bea@example.com", bookings: 6, spend: 2700, lastVisit: "08 Apr", status: "Member" },
  ];
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [bookingFilter, setBookingFilter] = useState("All activity");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const filteredCustomers = useMemo(() => customers.filter((customer) => {
    const matchesQuery = `${customer.name} ${customer.email}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "All statuses" || customer.status === status;
    const matchesBookings = bookingFilter === "All activity" || (bookingFilter === "Booked before" ? customer.bookings > 0 : customer.bookings === 0);
    return matchesQuery && matchesStatus && matchesBookings;
  }).sort((a, b) => {
    const left = a[sortKey]; const right = b[sortKey];
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
    return sortDirection === "asc" ? comparison : -comparison;
  }), [bookingFilter, query, sortDirection, sortKey, status]);
  const setSort = (key: SortKey) => { if (sortKey === key) setSortDirection((direction) => direction === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection("asc"); } };
  const clearFilters = () => { setQuery(""); setStatus("All statuses"); setBookingFilter("All activity"); };
  const sortIcon = (key: SortKey) => <ChevronDown size={13} className={`table-sort-icon ${sortKey === key ? "visible" : ""} ${sortKey === key && sortDirection === "desc" ? "desc" : ""}`} />;
  return <>
    <div className="admin-topbar"><div><span className="admin-breadcrumb">WORKSPACE / MEMBER DIRECTORY</span><h1>Customers</h1></div><button className="lime-button" onClick={() => toast("New member form opened")}><Plus size={16} /> Add member</button></div>
    <div className="customer-intro"><div><div className="eyebrow">MEMBER DIRECTORY</div><h2>Know who’s on court.</h2><p>Search your community, spot repeat players, and keep every member interaction in view.</p></div><div className="customer-count"><strong>{filteredCustomers.length}</strong><span>of {customers.length} members shown</span></div></div>
    <div className="table-card customer-table-card"><div className="customer-toolbar"><label className="customer-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email…" aria-label="Search customers" /></label><div className="customer-filters"><label><SlidersHorizontal size={14} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option>All statuses</option><option>Member</option><option>New member</option><option>Inactive</option></select></label><label><select value={bookingFilter} onChange={(event) => setBookingFilter(event.target.value)} aria-label="Filter by booking activity"><option>All activity</option><option>Booked before</option><option>No bookings</option></select></label><button className="clear-filter" onClick={clearFilters}>Clear filters</button></div></div><div className="table-meta"><span>{filteredCustomers.length} {filteredCustomers.length === 1 ? "customer" : "customers"}</span><span>Click a column to sort</span></div><div className="customer-table-wrap"><table className="customer-table"><thead><tr><th><button onClick={() => setSort("name")}>Customer {sortIcon("name")}</button></th><th><button onClick={() => setSort("bookings")}>Bookings {sortIcon("bookings")}</button></th><th><button onClick={() => setSort("spend")}>Lifetime spend {sortIcon("spend")}</button></th><th><button onClick={() => setSort("lastVisit")}>Last visit {sortIcon("lastVisit")}</button></th><th><button onClick={() => setSort("status")}>Status {sortIcon("status")}</button></th><th aria-label="Actions" /></tr></thead><tbody>{filteredCustomers.map((customer) => <tr key={customer.email}><td><div className="customer-name"><span>{customer.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{customer.name}</strong><small>{customer.email}</small></div></div></td><td>{customer.bookings}</td><td>₱{customer.spend.toLocaleString()}</td><td>{customer.lastVisit}</td><td><span className={`customer-status ${customer.status.toLowerCase().replace(" ", "-")}`}>{customer.status}</span></td><td><button className="row-more" onClick={() => toast(`${customer.name} actions opened`)} aria-label={`Open actions for ${customer.name}`}><MoreHorizontal size={16} /></button></td></tr>)}</tbody></table>{filteredCustomers.length === 0 && <div className="customer-empty"><Search size={20} /><strong>No customers match those filters.</strong><span>Try a broader search or clear the current filters.</span><button className="underlined-link" onClick={clearFilters}>Clear filters <ArrowRight size={14} /></button></div>}</div></div>
  </>;
}

function SimpleAdmin({ kind }: { kind: Exclude<AdminView, "dashboard" | "schedule"> }) { const simpleKind = kind as string; if (simpleKind === "customers") return <CustomerTable />; const titles: Record<Exclude<AdminView, "dashboard" | "schedule">, readonly [string, string, string]> = { resources: ["Resources", "Four courts, one clear view.", "COURT INVENTORY"], customers: ["Customers", "Know who’s on court.", "MEMBER DIRECTORY"], settings: ["Settings", "Make the rules clear.", "CLUB SETTINGS"] }; const [title, sub, label] = titles[simpleKind as keyof typeof titles]; return <><div className="admin-topbar"><div><span className="admin-breadcrumb">WORKSPACE / {label}</span><h1>{title}</h1></div><button className="lime-button" onClick={() => toast(`${title} action opened`)}><Plus size={16} /> Add {simpleKind === "resources" ? "resource" : simpleKind === "customers" ? "member" : "rule"}</button></div><div className="simple-admin-intro"><div><div className="eyebrow">{label}</div><h2>{sub}</h2><p>This reusable core view is ready to connect to your Supabase data model. The pickleball skin supplies the court names, surface labels, and club vocabulary.</p></div><div className="simple-number">{simpleKind === "resources" ? "04" : simpleKind === "customers" ? "318" : "12h"}<small>{simpleKind === "resources" ? "bookable courts" : simpleKind === "customers" ? "active members" : "cancellation window"}</small></div></div><div className="table-card"><div className="table-toolbar"><input placeholder={`Search ${title.toLowerCase()}…`} /><button className="outline-button">Filter <ChevronDown size={15} /></button></div>{(simpleKind === "resources" ? courts.map(c => [c.name, c.meta, c.price, "Active"]) : simpleKind === "customers" ? [["Alex dela Cruz", "alex@example.com", "24 bookings", "Member"],["Mia Santos", "mia@example.com", "12 bookings", "Member"],["Jon Bell", "jon@example.com", "3 bookings", "New member"]] : [["Opening hours", "Mon–Sun · 06:00–22:00", "", "Active"],["Cancellation policy", "12 hours before start", "", "Active"],["Blackout dates", "No blackout dates", "", "Clear"]]).map((row, i) => <div className="table-row" key={i}>{row.map((cell, j) => <span key={j} className={j === row.length - 1 ? "row-badge" : j === 0 ? "row-primary" : ""}>{cell}</span>)}<button className="row-more" aria-label={`Open actions for ${row[0]}`} onClick={() => toast(`${row[0]} actions opened`)}><MoreHorizontal size={16} /></button></div>)}</div>{simpleKind === "settings" && <EmbedSettings />}</>; }

function EmbedSettings() {
  const origin = window.location.origin;
  return <section className="embed-card" aria-labelledby="embed-title"><div><span className="admin-breadcrumb">SHARE YOUR BOARD</span><h2 id="embed-title">Embed the booking board</h2><p>Paste this snippet into any website to show live court availability. Players book straight from it.</p></div><CodeBlock label="Embed snippet" code={`<iframe\n  src="${origin}/?view=book"\n  title="Book a court at Baseline Pickle Club"\n  width="100%"\n  height="720"\n  style="border:0"\n  loading="lazy"\n></iframe>`} /><CodeBlock label="Direct booking link" code={`${origin}/?view=book`} /></section>;
}

export default function Home() {
  const [initial] = useState(() => urlToTarget(window.location.pathname, window.location.search, window.location.hash));
  const [mode, setMode] = useState<Mode>(initial.area);
  const [view, setView] = useState<PublicView>(initial.area === "public" ? initial.view : "home");
  const [bookingMaxPlayers, setBookingMaxPlayers] = useState(4);
  const [adminView, setAdminView] = useState<AdminView>(initial.area === "admin" ? initial.view : "dashboard");
  // A fresh object each time so jumping to the same anchor twice still scrolls.
  const [anchor, setAnchor] = useState<{ id: string } | null>(initial.area === "public" && initial.anchor ? { id: initial.anchor } : null);
  const [signInOpen, setSignInOpen] = useState(false);

  const go = useCallback((target: SiteTarget, updateHistory = true) => {
    if (updateHistory) {
      const url = targetToUrl(target);
      if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.pushState({}, "", url);
    }
    if (target.area === "admin") { setMode("admin"); setAdminView(target.view); setAnchor(null); }
    else { setMode("public"); setView(target.view); setAnchor(target.anchor ? { id: target.anchor } : null); }
    if (target.area === "admin" || !target.anchor) window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPopState = () => go(urlToTarget(window.location.pathname, window.location.search, window.location.hash), false);
    const onNavigate = (event: Event) => { event.preventDefault(); go((event as CustomEvent<SiteTarget>).detail); };
    window.addEventListener("popstate", onPopState);
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => { window.removeEventListener("popstate", onPopState); window.removeEventListener(NAVIGATE_EVENT, onNavigate); };
  }, [go]);

  // Scroll to (and focus) a section, FAQ or post once its view has rendered.
  useEffect(() => {
    if (!anchor) return;
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(anchor.id);
      if (!element) return;
      if (element instanceof HTMLDetailsElement) element.open = true;
      element.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      const focusTarget = element instanceof HTMLDetailsElement ? element.querySelector("summary") : element;
      focusTarget?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [anchor, view, mode]);

  const showView = (next: PublicView) => go({ area: "public", view: next });
  const goBook = () => showView("book");
  const enterAdmin = () => go({ area: "admin", view: adminView });
  const exitAdmin = () => go({ area: "public", view });
  const showAdminView = (next: AdminView) => go({ area: "admin", view: next });

  if (mode === "admin") return <AdminShell view={adminView} setView={showAdminView} exit={exitAdmin}><div className="view-enter" key={adminView}>{adminView === "dashboard" ? <AdminDashboard setView={showAdminView} /> : adminView === "schedule" ? <ScheduleView /> : <SimpleAdmin kind={adminView} />}</div></AdminShell>;
  return <div className="public-shell"><PublicHeader view={view} setView={showView} onAdmin={enterAdmin} onOpenPlay={() => showView("openplay")} onSignIn={() => setSignInOpen(true)} /><main id={MAIN_ID} tabIndex={-1} className="view-enter" key={view}>{view === "home" && <HomeView goBook={goBook} go={go} />}{view === "book" && <><BookingBoard onConfirm={(_court, maxPlayers) => { setBookingMaxPlayers(maxPlayers); }} /><BookingFlow maxPlayers={bookingMaxPlayers} onBack={() => showView("home")} /></>}{view === "account" && <AccountView goBook={goBook} />}{view === "openplay" && <OpenPlayView onBack={() => showView("home")} />}{view === "news" && <NewsView onBack={() => showView("home")} />}</main><SignInDialog open={signInOpen} onOpenChange={setSignInOpen} /><FloatingContact /></div>;
}
