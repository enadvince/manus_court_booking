/* Baseline Pickle Club skin: court-first geometry, court green + ball yellow, Space Grotesk/DM Sans, editorial asymmetric rhythm. Core system: shell, booking, account/admin views. Skin: pickleball vocabulary, court diagrams. */
import { lazy, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Search, Trophy } from "lucide-react";
import { firstName, signOutMember, useSession, type Member } from "@/lib/auth";
import { getAvailability } from "@/lib/booking/availability";
import { COURTS, RULES } from "@/lib/booking/rules";
import { bookingsFor, myBookings } from "@/lib/booking/store";
import {
  formatShortDay,
  formatTime,
  manilaNow,
  toClock,
} from "@/lib/booking/time";
import {
  NAVIGATE_EVENT,
  targetToUrl,
  urlToTarget,
  type AdminView,
  type PublicView,
  type SiteTarget,
} from "@/lib/navigation";
import { contact, posts } from "@/lib/siteContent";
import { BookingPage } from "@/components/booking/BookingPage";
import {
  openBooking,
  useBookingsVersion,
} from "@/components/booking/bookingState";
import {
  FaqSection,
  NewsletterSignup,
  NewsView,
  PoliciesView,
  PostDates,
} from "@/components/site/ContentSections";
import { Mark } from "@/components/site/Mark";
import { MobileMenu } from "@/components/site/MobileMenu";
import { openSearch } from "@/components/site/SiteSearch";
import { FloatingContact, MAIN_ID } from "@/components/site/SiteChrome";
import { SignInView } from "@/components/site/SignInView";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { scrollBehavior, useScrolled } from "@/components/site/hooks";

type Mode = "public" | "admin";

// Loaded on demand so the landing page stays light. App's Suspense shows the loader.
const AdminArea = lazy(() =>
  import("@/components/admin/AdminViews").then(m => ({ default: m.AdminArea }))
);
const AccountView = lazy(() =>
  import("@/components/club/AccountView").then(m => ({
    default: m.AccountView,
  }))
);
const OpenPlayView = lazy(() =>
  import("@/components/club/OpenPlayView").then(m => ({
    default: m.OpenPlayView,
  }))
);

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function PublicHeader({
  view,
  setView,
  onAdmin,
  onOpenPlay,
  member,
  onSignOut,
}: {
  view: PublicView;
  setView: (view: PublicView) => void;
  onAdmin: () => void;
  onOpenPlay: () => void;
  member: Member | null;
  onSignOut: () => void;
}) {
  const scrolled = useScrolled(8);
  const navItems: { id: PublicView; label: string }[] = [
    { id: "home", label: "Club" },
    { id: "book", label: "Book a court" },
    { id: "news", label: "News" },
    { id: "account", label: "My bookings" },
  ];
  return (
    <header className={`public-header ${scrolled ? "is-scrolled" : ""}`}>
      <button
        className="wordmark"
        onClick={() => setView("home")}
        aria-label="Baseline Pickle Club home"
      >
        <Mark /> <span>baseline</span>
      </button>
      <nav className="public-nav" aria-label="Public navigation">
        {navItems.map(item => (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <button
          className={`text-button desktop-only ${view === "openplay" ? "active" : ""}`}
          aria-current={view === "openplay" ? "page" : undefined}
          onClick={onOpenPlay}
        >
          Open Play
        </button>
        <button className="text-button desktop-only" onClick={onAdmin}>
          Club ops
        </button>
        {member ? (
          <button
            className="text-button desktop-only member-chip"
            onClick={() => setView("account")}
            aria-label={`Signed in as ${member.name}. Open my bookings`}
          >
            <span aria-hidden="true">{initials(member.name)}</span>
            {firstName(member.name)}
          </button>
        ) : (
          <button
            className={`text-button desktop-only ${view === "signin" ? "active" : ""}`}
            aria-current={view === "signin" ? "page" : undefined}
            onClick={() => setView("signin")}
          >
            Sign in
          </button>
        )}
        <button
          className="icon-button search-trigger"
          onClick={openSearch}
          aria-label="Search the site (press /)"
          title="Search (/ or Ctrl K)"
        >
          <Search size={18} />
        </button>
        <ThemeToggle className="icon-button desktop-only" />
        <button className="pill-button" onClick={() => setView("book")}>
          Book now <ArrowRight size={15} />
        </button>
        <MobileMenu
          view={view}
          onNavigate={setView}
          onAdmin={onAdmin}
          member={member}
          onSignOut={onSignOut}
          onSearch={openSearch}
        />
      </div>
    </header>
  );
}

function Hero({ onBook }: { onBook: () => void }) {
  return (
    <section className="hero-section">
      <div
        className="hero-image"
        role="img"
        aria-label="Players rallying on an indoor pickleball court"
      />
      <div className="hero-overlay" />
      <div className="hero-copy">
        <div className="eyebrow light">
          <span className="eyebrow-dot" /> Cebu's court-first club
        </div>
        <h1>
          Your court
          <br />
          <span className="hero-accent">is waiting.</span>
        </h1>
        <p>
          Book the game, not the back-and-forth. Four tournament-ready indoor
          courts, right in the heart of the city.
        </p>
        <button className="lime-button" onClick={onBook}>
          See open courts <ArrowRight size={17} />
        </button>
      </div>
      <div className="hero-stamp">
        <Trophy size={16} /> Open play, elevated
      </div>
      <div className="hero-scroll">
        SCROLL TO PLAY <span>↓</span>
      </div>
    </section>
  );
}

/** The next four start times today (or tomorrow once today has closed) on the first two courts. */
function QuickCourtPreview({ goBook }: { goBook: () => void }) {
  useBookingsVersion();
  const now = manilaNow();
  const date =
    now.minutes >= RULES.closeMins - RULES.stepMins
      ? formatDayAfter(now.date)
      : now.date;
  const slots = getAvailability(date, 60, COURTS, bookingsFor(date), RULES)
    .filter(slot => slot.status !== "past" && slot.status !== "closing")
    .slice(0, 4);
  return (
    <section className="quick-board">
      <div className="quick-board-copy">
        <div className="eyebrow">
          {date === now.date ? "RIGHT NOW" : "TOMORROW"} /{" "}
          {formatShortDay(date).toUpperCase()}
        </div>
        <h2>
          See the open
          <br />
          <span>lanes.</span>
        </h2>
        <p>
          Choose a time and we'll find the court. Tap an open lane to start
          booking.
        </p>
        <button className="underlined-link" onClick={goBook}>
          Show me the full board <ArrowRight size={15} />
        </button>
      </div>
      <div className="quick-lanes">
        <div className="quick-lane-header">
          <span>COURT</span>
          {slots.map(slot => (
            <span key={slot.start}>
              {formatTime(slot.start).replace(":00", "")}
            </span>
          ))}
        </div>
        {COURTS.slice(0, 2).map((court, index) => (
          <div className="quick-lane" key={court.id}>
            <div
              className={`quick-court-label ${index === 0 ? "green" : "blue"}`}
            >
              <b>{court.short}</b>
              <span>{index === 0 ? "Green lane" : "Blue lane"}</span>
            </div>
            {slots.map(slot => {
              const free = slot.freeCourtIds.includes(court.id);
              return (
                <button
                  key={slot.start}
                  className={free ? "free" : "busy"}
                  disabled={!free}
                  aria-label={`${court.name} ${formatTime(slot.start)} ${free ? "open, book it" : "booked"}`}
                  onClick={() =>
                    openBooking({
                      date,
                      time: toClock(slot.start),
                      court: court.id,
                    })
                  }
                >
                  {free ? "OPEN" : "FULL"}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="quick-court-mark" aria-hidden="true">
        <span />
        <i />
      </div>
    </section>
  );
}

function formatDayAfter(isoDay: string) {
  const date = new Date(`${isoDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function HomeView({
  goBook,
  go,
}: {
  goBook: () => void;
  go: (target: SiteTarget) => void;
}) {
  return (
    <>
      <Hero onBook={goBook} />
      <QuickCourtPreview goBook={goBook} />
      <section className="intro-section">
        <div className="intro-tag">BASELINE / A NEW KIND OF CLUB</div>
        <div className="intro-grid">
          <h2>
            More court time.
            <br />
            <span>Less admin.</span>
          </h2>
          <div>
            <p>
              Pickleball is better when getting on court is effortless. Baseline
              is built around the rhythm of the game: clear lanes, quick
              decisions, and a club that knows when to get out of the way.
            </p>
            <button className="underlined-link" onClick={goBook}>
              Find your next game <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <div className="feature-strip">
          <div className="feature-image court-photo" />
          <div className="feature-copy">
            <div className="eyebrow">THE COURTS</div>
            <h3>
              Made for the
              <br />
              <em>long rally.</em>
            </h3>
            <p>
              Pro-grade surface, tournament lighting, and enough room to make
              your third shot count.
            </p>
            <span className="feature-index">01 / 03</span>
          </div>
          <div className="feature-stat">
            <strong>4</strong>
            <span>
              indoor courts
              <br />
              in one club
            </span>
          </div>
        </div>
      </section>
      <section className="club-values">
        <div className="eyebrow">WHY BASELINE</div>
        <h2>
          Good games
          <br />
          <em>start here.</em>
        </h2>
        <div className="value-grid">
          <div>
            <span>01</span>
            <h3>Book in a minute</h3>
            <p>No calls, no waiting. See exactly what’s open and lock it in.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Play your way</h3>
            <p>Bring your crew, join open play, or get some reps in solo.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Stay for the rally</h3>
            <p>Rackets, refreshments, and good energy are always on hand.</p>
          </div>
        </div>
      </section>
      <section className="community-band">
        <div className="community-photo" />
        <div className="community-copy">
          <div className="eyebrow light">THE CLUBHOUSE</div>
          <h2>
            Come for the court.
            <br />
            <em>Stay for the people.</em>
          </h2>
          <p>
            A little competitive, never intimidating. Baseline is where Cebu
            comes to play.
          </p>
          <button
            className="outline-light"
            onClick={() => toast("Clubhouse tour request noted")}
          >
            Meet the club <ArrowRight size={16} />
          </button>
        </div>
      </section>
      <section className="news-teaser" aria-labelledby="news-teaser-title">
        <div className="section-title">
          <div>
            <div className="eyebrow">FROM THE CLUB</div>
            <h2 id="news-teaser-title">Latest news</h2>
          </div>
          <button
            className="underlined-link"
            onClick={() => go({ area: "public", view: "news" })}
          >
            All news <ArrowRight size={14} />
          </button>
        </div>
        <div className="news-teaser-grid">
          {posts.map(post => (
            <article key={post.id} className="news-card">
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <PostDates post={post} />
              <button
                className="underlined-link"
                onClick={() =>
                  go({ area: "public", view: "news", anchor: post.id })
                }
                aria-label={`Read: ${post.title}`}
              >
                Read post <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>
      <FaqSection />
      <NewsletterSignup />
      <PublicFooter go={go} />
    </>
  );
}

function PublicFooter({ go }: { go: (target: SiteTarget) => void }) {
  return (
    <footer className="public-footer">
      <div className="wordmark">
        <Mark dark />
        <span>baseline</span>
      </div>
      <span>Indoor pickleball, Cebu City</span>
      <a href={`mailto:${contact.email}`}>{contact.email}</a>
      <a href={contact.mapsUrl} target="_blank" rel="noopener noreferrer">
        Directions
        <span className="sr-only"> (opens Google Maps in a new tab)</span>
      </a>
      <button
        className="footer-link"
        onClick={() => go({ area: "public", view: "news" })}
      >
        News
      </button>
      <button
        className="footer-link"
        onClick={() => go({ area: "public", view: "policies" })}
      >
        Policies
      </button>
      <span>© {new Date().getFullYear()} Baseline Pickle Club</span>
      <span className="footer-credit">Developed by WaddleLabs</span>
    </footer>
  );
}

export default function Home() {
  const [initial] = useState(() =>
    urlToTarget(
      window.location.pathname,
      window.location.search,
      window.location.hash
    )
  );
  const [mode, setMode] = useState<Mode>(initial.area);
  const [view, setView] = useState<PublicView>(
    initial.area === "public" ? initial.view : "home"
  );
  const [adminView, setAdminView] = useState<AdminView>(
    initial.area === "admin" ? initial.view : "dashboard"
  );
  // A fresh object each time so jumping to the same anchor twice still scrolls.
  const [anchor, setAnchor] = useState<{ id: string } | null>(
    initial.area === "public" && initial.anchor ? { id: initial.anchor } : null
  );
  const member = useSession();

  const go = useCallback((target: SiteTarget, updateHistory = true) => {
    if (updateHistory) {
      const url = targetToUrl(target);
      if (
        url !==
        window.location.pathname + window.location.search + window.location.hash
      )
        window.history.pushState({}, "", url);
    }
    if (target.area === "admin") {
      setMode("admin");
      setAdminView(target.view);
      setAnchor(null);
    } else {
      setMode("public");
      setView(target.view);
      setAnchor(target.anchor ? { id: target.anchor } : null);
    }
    if (target.area === "admin" || !target.anchor) window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPopState = () =>
      go(
        urlToTarget(
          window.location.pathname,
          window.location.search,
          window.location.hash
        ),
        false
      );
    const onNavigate = (event: Event) => {
      event.preventDefault();
      go((event as CustomEvent<SiteTarget>).detail);
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener(NAVIGATE_EVENT, onNavigate);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener(NAVIGATE_EVENT, onNavigate);
    };
  }, [go]);

  // Scroll to (and focus) a section, FAQ or post once its view has rendered.
  useEffect(() => {
    if (!anchor) return;
    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(anchor.id);
      if (!element) return;
      if (element instanceof HTMLDetailsElement) element.open = true;
      element.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
      const focusTarget =
        element instanceof HTMLDetailsElement
          ? element.querySelector("summary")
          : element;
      focusTarget?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [anchor, view, mode]);

  const showView = (next: PublicView) => go({ area: "public", view: next });
  const goBook = () => showView("book");
  const enterAdmin = () => go({ area: "admin", view: adminView });
  const exitAdmin = () => go({ area: "public", view });
  const showAdminView = (next: AdminView) => go({ area: "admin", view: next });
  const signOut = () => {
    signOutMember();
    toast("You're signed out. See you on court.");
    if (view === "account") showView("home");
  };

  // A signed-in member who lands on the sign-in page goes straight to their bookings.
  useEffect(() => {
    if (mode !== "public" || view !== "signin" || !member) return;
    window.history.replaceState(
      {},
      "",
      targetToUrl({ area: "public", view: "account" })
    );
    go({ area: "public", view: "account" }, false);
  }, [go, member, mode, view]);

  if (mode === "admin")
    return (
      <AdminArea view={adminView} setView={showAdminView} exit={exitAdmin} />
    );
  return (
    <div className="public-shell">
      <PublicHeader
        view={view}
        setView={showView}
        onAdmin={enterAdmin}
        onOpenPlay={() => showView("openplay")}
        member={member}
        onSignOut={signOut}
      />
      <main id={MAIN_ID} tabIndex={-1} className="view-enter" key={view}>
        {view === "home" && <HomeView goBook={goBook} go={go} />}
        {view === "book" && <BookingPage member={member} />}
        {view === "account" &&
          (member || myBookings().length ? (
            <AccountView
              goBook={goBook}
              member={member}
              onSignOut={signOut}
              onSignIn={() => showView("signin")}
            />
          ) : (
            <SignInView
              onBack={() => showView("home")}
              notice="Sign in to see your bookings, or book as a guest and they'll show up here."
            />
          ))}
        {view === "policies" && (
          <PoliciesView onBack={() => showView("home")} />
        )}
        {view === "signin" && <SignInView onBack={() => showView("home")} />}
        {view === "openplay" && (
          <OpenPlayView onBack={() => showView("home")} />
        )}
        {view === "news" && <NewsView onBack={() => showView("home")} />}
      </main>
      <FloatingContact />
    </div>
  );
}
