import {
  ArrowRight,
  CalendarDays,
  Home,
  Newspaper,
  Search,
  Users,
} from "lucide-react";
import { openSearch } from "@/components/site/SiteSearch";
import { MAIN_ID } from "@/components/site/SiteChrome";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { navigateTo, type SiteTarget } from "@/lib/navigation";

const destinations: {
  label: string;
  detail: string;
  target: SiteTarget;
  icon: typeof Home;
}[] = [
  {
    label: "Book a court",
    detail: "See today’s open lanes",
    target: { area: "public", view: "book" },
    icon: CalendarDays,
  },
  {
    label: "Open Play",
    detail: "Join a hosted session",
    target: { area: "public", view: "openplay" },
    icon: Users,
  },
  {
    label: "Club news",
    detail: "What’s new on court",
    target: { area: "public", view: "news" },
    icon: Newspaper,
  },
];

export default function NotFound() {
  const path = window.location.pathname;
  return (
    <div className="notfound-page">
      <header className="notfound-header">
        <a className="wordmark" href="/" aria-label="Baseline Pickle Club home">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>baseline</span>
        </a>
        <ThemeToggle />
      </header>
      <main id={MAIN_ID} tabIndex={-1} className="notfound-main">
        <div className="notfound-court" aria-hidden="true">
          <span className="notfound-net" />
          <span className="notfound-kitchen" />
          <span className="notfound-ball" />
        </div>
        <div className="notfound-copy">
          <div className="eyebrow">ERROR 404 · OUT OF BOUNDS</div>
          <h1>
            That shot
            <br />
            <em>landed long.</em>
          </h1>
          <p>
            We couldn’t find <code>{path}</code>. The page may have moved, or
            the link has a typo. Let’s get you back in play.
          </p>
          <div className="notfound-actions">
            <a className="lime-button" href="/">
              <Home size={16} /> Back to the club
            </a>
            <button
              type="button"
              className="outline-button"
              onClick={openSearch}
            >
              <Search size={16} /> Search the site
            </button>
          </div>
          <ul className="notfound-links">
            {destinations.map(({ label, detail, target, icon: Icon }) => (
              <li key={label}>
                <button type="button" onClick={() => navigateTo(target)}>
                  <Icon size={17} aria-hidden="true" />
                  <span>
                    <strong>{label}</strong>
                    <small>{detail}</small>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
