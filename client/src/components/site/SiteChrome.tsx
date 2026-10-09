import { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  ArrowUp,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  X,
} from "lucide-react";
import { readConsent, writeConsent, type Consent } from "@/lib/consent";
import { contact } from "@/lib/siteContent";
import { addUtmParams } from "@/lib/utm";
import { scrollBehavior, useScrolled } from "./hooks";

export const MAIN_ID = "main-content";

export function SkipLink() {
  return (
    <a
      className="skip-link"
      href={`#${MAIN_ID}`}
      onClick={event => {
        // Move focus without adding a history entry for the fragment.
        const main = document.getElementById(MAIN_ID);
        if (!main) return;
        event.preventDefault();
        main.focus({ preventScroll: true });
        main.scrollIntoView({ block: "start" });
      }}
    >
      Skip to content
    </a>
  );
}

/** Thin bar along the top edge showing how far down the page you are. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const progress =
        max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.current?.style.setProperty("transform", `scaleX(${progress})`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Page height changes when views switch, even without scrolling.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <div ref={bar} />
    </div>
  );
}

export function BackToTop() {
  const visible = useScrolled(600);
  if (!visible) return null;
  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: scrollBehavior() });
        // Return keyboard focus to the top of the content as well.
        document.getElementById(MAIN_ID)?.focus({ preventScroll: true });
      }}
    >
      <ArrowUp size={18} />
    </button>
  );
}

export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const mapsHref = addUtmParams(contact.mapsUrl, window.location.origin);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="contact-fab"
          aria-label={open ? "Close contact options" : "Contact the club"}
        >
          {open ? <X size={20} /> : <MessageCircle size={20} />}
          <span className="contact-fab-label">Contact</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="contact-panel"
          side="top"
          align="end"
          sideOffset={12}
          collisionPadding={16}
        >
          <span className="eyebrow">TALK TO THE CLUB</span>
          <h2>We usually reply within the hour.</h2>
          <a
            href={contact.messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessagesSquare size={16} />
            <span>
              <strong>Message us on Messenger</strong>
              <small>Fastest replies (opens Messenger)</small>
            </span>
          </a>
          <a href={`mailto:${contact.email}`}>
            <Mail size={16} />
            <span>
              <strong>Email</strong>
              <small>{contact.email}</small>
            </span>
          </a>
          <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>
            <Phone size={16} />
            <span>
              <strong>Call the front desk</strong>
              <small>{contact.phone}</small>
            </span>
          </a>
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            <MapPin size={16} />
            <span>
              <strong>Get directions</strong>
              <small>{contact.address} (opens Google Maps)</small>
            </span>
          </a>
          <p className="contact-hours">
            <Clock3 size={14} /> Open daily 6:00 AM to 10:00 PM
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function CookieBanner() {
  const [consent, setConsent] = useState<Consent | null>(() => readConsent());
  const banner = useRef<HTMLDivElement>(null);

  // Lift floating buttons above the banner while it is on screen.
  useEffect(() => {
    const root = document.documentElement;
    if (consent || !banner.current) {
      root.style.removeProperty("--banner-offset");
      return;
    }
    const element = banner.current;
    const observer = new ResizeObserver(() => {
      root.style.setProperty(
        "--banner-offset",
        `${element.offsetHeight + 16}px`
      );
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--banner-offset");
    };
  }, [consent]);

  if (consent) return null;
  const choose = (value: Consent) => {
    writeConsent(value);
    setConsent(value);
  };
  return (
    <div
      ref={banner}
      className="cookie-banner"
      role="region"
      aria-label="Cookie preferences"
    >
      <p>
        <strong>Cookies, kept simple.</strong> We store your theme and this
        choice on this device. With your OK we also run privacy-friendly
        analytics to see which pages help players most.
      </p>
      <div className="cookie-actions">
        <button
          type="button"
          className="outline-button"
          onClick={() => choose("declined")}
        >
          Essential only
        </button>
        <button
          type="button"
          className="lime-button"
          onClick={() => choose("accepted")}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}

/**
 * Adds UTM parameters to every outbound link right before it is used
 * (click, middle-click, context menu or keyboard focus), so links rendered
 * anywhere on the site are covered without each one opting in.
 */
export function OutboundLinkTagger() {
  useEffect(() => {
    const tag = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href")!;
      const tagged = addUtmParams(href, window.location.origin);
      if (tagged !== href) anchor.setAttribute("href", tagged);
    };
    const events = [
      "pointerdown",
      "focusin",
      "click",
      "auxclick",
      "contextmenu",
    ];
    events.forEach(name => document.addEventListener(name, tag, true));
    return () =>
      events.forEach(name => document.removeEventListener(name, tag, true));
  }, []);
  return null;
}
