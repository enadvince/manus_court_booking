import { useId, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Mail,
} from "lucide-react";
import { formatDay } from "@/lib/dates";
import { isValidEmail, subscribeToNewsletter } from "@/lib/newsletter";
import { faqs, posts, type Post } from "@/lib/siteContent";
import { ConfirmDialog } from "./Dialogs";

export function FaqSection() {
  return (
    <section
      className="faq-section"
      id="faq"
      tabIndex={-1}
      aria-labelledby="faq-title"
    >
      <div className="faq-intro">
        <div className="eyebrow">GOOD TO KNOW</div>
        <h2 id="faq-title">
          Questions,
          <br />
          <em>answered.</em>
        </h2>
        <p>
          Everything players ask before their first game. Still stuck? Tap
          Contact any time.
        </p>
      </div>
      <div className="faq-list">
        {faqs.map(faq => (
          <details key={faq.id} id={faq.id} className="faq-item">
            <summary>
              <span>{faq.question}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

type NewsletterState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; email: string };

export function NewsletterSignup() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<NewsletterState>({ status: "idle" });
  const [confirmUnsubscribe, setConfirmUnsubscribe] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (state.status === "loading") return;
    if (!isValidEmail(email)) {
      setState({
        status: "error",
        message: "Enter a valid email address, like alex@example.com.",
      });
      return;
    }
    setState({ status: "loading" });
    const result = await subscribeToNewsletter(email);
    setState(
      result.ok
        ? { status: "success", email: email.trim() }
        : { status: "error", message: result.message }
    );
  };

  return (
    <section
      className="newsletter"
      id="newsletter"
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
    >
      <div>
        <div className="eyebrow light">THE BASELINE LETTER</div>
        <h2 id={`${id}-title`}>
          First dibs on
          <br />
          <em>open play.</em>
        </h2>
        <p>
          One short email a fortnight: new sessions, court news, and the
          occasional members-only slot.
        </p>
      </div>
      <div aria-live="polite">
        {state.status === "success" ? (
          <div className="newsletter-success">
            <CheckCircle2 size={26} aria-hidden="true" />
            <div>
              <strong>You’re on the list.</strong>
              <span>
                We’ll send the next letter to <b>{state.email}</b>.
              </span>
              <button
                type="button"
                className="text-link-light"
                onClick={() => setConfirmUnsubscribe(true)}
              >
                Unsubscribe
              </button>
            </div>
          </div>
        ) : (
          <form className="newsletter-form" onSubmit={submit} noValidate>
            <label htmlFor={`${id}-email`}>Email address</label>
            <div className="newsletter-row">
              <span className="newsletter-input">
                <Mail size={16} aria-hidden="true" />
                <input
                  id={`${id}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={event => {
                    setEmail(event.target.value);
                    if (state.status === "error") setState({ status: "idle" });
                  }}
                  aria-invalid={state.status === "error" || undefined}
                  aria-describedby={
                    state.status === "error" ? `${id}-error` : undefined
                  }
                />
              </span>
              <button
                className="lime-button"
                type="submit"
                disabled={state.status === "loading"}
              >
                {state.status === "loading" ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> Joining…
                  </>
                ) : (
                  <>
                    Subscribe <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
            {state.status === "error" && (
              <p id={`${id}-error`} className="form-error">
                {state.message}
              </p>
            )}
            <small className="newsletter-note">
              No spam. Unsubscribe in one click.
            </small>
          </form>
        )}
      </div>
      <ConfirmDialog
        open={confirmUnsubscribe}
        onOpenChange={setConfirmUnsubscribe}
        title="Unsubscribe from the newsletter?"
        description="You’ll stop getting open play dates and club news by email. You can sign up again any time."
        confirmLabel="Unsubscribe"
        cancelLabel="Stay subscribed"
        onConfirm={() => {
          setEmail("");
          setState({ status: "idle" });
        }}
      />
    </section>
  );
}

export function PostDates({ post }: { post: Post }) {
  return (
    <p className="post-dates">
      <span>
        Published{" "}
        <time dateTime={post.published}>{formatDay(post.published)}</time>
      </span>
      <span className="post-updated">
        Last updated{" "}
        <time dateTime={post.updated}>{formatDay(post.updated)}</time>
      </span>
    </p>
  );
}

export function NewsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="news-page">
      <button className="back-link" onClick={onBack}>
        <ChevronLeft size={16} /> Back to club
      </button>
      <header className="news-header">
        <div className="eyebrow">CLUB NEWS</div>
        <h1>
          What’s new
          <br />
          <em>on court.</em>
        </h1>
      </header>
      <div className="news-list">
        {posts.map(post => (
          <article
            key={post.id}
            id={post.id}
            tabIndex={-1}
            className="news-post"
            aria-labelledby={`${post.id}-title`}
          >
            <span className="summary-label">{post.author.toUpperCase()}</span>
            <h2 id={`${post.id}-title`}>{post.title}</h2>
            <PostDates post={post} />
            {post.body.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
