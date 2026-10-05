import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, Users } from "lucide-react";
import { toast } from "sonner";
import {
  firstName,
  passwordStrength,
  registerMember,
  signInMember,
  validateRegistration,
  validateSignIn,
  MIN_PASSWORD_LENGTH,
  type FieldErrors,
  type Member,
} from "@/lib/auth";
import { PasswordInput } from "./Dialogs";

export type AuthMode = "signin" | "register";

export function readAuthMode(search: string): AuthMode {
  return new URLSearchParams(search).get("mode") === "register"
    ? "register"
    : "signin";
}

/** The member sign-in page, with a second tab for creating an account. */
export function SignInView({
  onBack,
  onAuthenticated,
  notice,
}: {
  onBack: () => void;
  onAuthenticated?: (member: Member) => void;
  /** Shown above the form, e.g. when a members-only page sent the visitor here. */
  notice?: string;
}) {
  const [mode, setModeState] = useState<AuthMode>(() =>
    readAuthMode(window.location.search)
  );
  const [carriedEmail, setCarriedEmail] = useState("");
  const setMode = (next: AuthMode, email = "") => {
    setModeState(next);
    setCarriedEmail(email);
    const url = new URL(window.location.href);
    if (next === "register") url.searchParams.set("mode", "register");
    else url.searchParams.delete("mode");
    window.history.replaceState(window.history.state, "", url);
  };
  const isRegister = mode === "register";
  const finish = (member: Member) => {
    const url = new URL(window.location.href);
    url.searchParams.delete("mode");
    window.history.replaceState(window.history.state, "", url);
    onAuthenticated?.(member);
  };

  return (
    <div className="auth-page">
      <section className="auth-aside" aria-hidden="true">
        <div className="auth-court">
          <span />
          <i />
        </div>
        <div className="auth-aside-copy">
          <div className="eyebrow light">
            <span className="eyebrow-dot" /> BASELINE MEMBERS
          </div>
          <h2>
            {isRegister ? (
              <>
                First serve
                <br />
                <em>is on us.</em>
              </>
            ) : (
              <>
                Back on
                <br />
                <em>the baseline.</em>
              </>
            )}
          </h2>
          <ul className="auth-perks">
            <li>
              <CalendarDays size={16} /> Book and manage courts in a minute
            </li>
            <li>
              <Users size={16} /> Join open play and see your spot in line
            </li>
            <li>
              <ArrowRight size={16} /> Reschedule or cancel without a call
            </li>
          </ul>
        </div>
      </section>
      <section className="auth-main">
        <button className="back-link" onClick={onBack}>
          <ChevronLeft size={16} /> Back to club
        </button>
        <div className="auth-card">
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Sign in or create an account"
          >
            {(
              [
                ["signin", "Sign in"],
                ["register", "Create account"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                id={`auth-tab-${id}`}
                role="tab"
                aria-selected={mode === id}
                aria-controls="auth-panel"
                tabIndex={mode === id ? 0 : -1}
                className={mode === id ? "active" : ""}
                onClick={() => setMode(id)}
                onKeyDown={event => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                    return;
                  const next = mode === "signin" ? "register" : "signin";
                  setMode(next);
                  document.getElementById(`auth-tab-${next}`)?.focus();
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={`auth-tab-${mode}`}
          >
            {notice && <p className="auth-notice">{notice}</p>}
            {isRegister ? (
              <RegisterForm
                key="register"
                initialEmail={carriedEmail}
                onDone={finish}
                onSwitch={email => setMode("signin", email)}
              />
            ) : (
              <SignInForm
                key="signin"
                initialEmail={carriedEmail}
                onDone={finish}
                onSwitch={email => setMode("register", email)}
              />
            )}
          </div>
        </div>
        <p className="auth-footnote">
          Demo mode: accounts are saved in this browser only until the club
          connects its member login.
        </p>
      </section>
    </div>
  );
}

type FormProps = {
  initialEmail: string;
  onDone: (member: Member) => void;
  onSwitch: (email: string) => void;
};

/** After a rejected submit, moves focus to the first invalid field. */
function useFocusFirstError() {
  const formRef = useRef<HTMLFormElement>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!attempt) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [attempt]);
  return [formRef, () => setAttempt(count => count + 1)] as const;
}

/** Clears a field's error as soon as the member edits that field. */
function clearErrorOnInput<K extends string>(
  setErrors: (update: (errors: FieldErrors<K>) => FieldErrors<K>) => void
) {
  return (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement).name as K;
    setErrors(errors => {
      if (!errors[name]) return errors;
      const next = { ...errors };
      delete next[name];
      return next;
    });
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} className="form-error">
      {message}
    </p>
  );
}

function SignInForm({ initialEmail, onDone, onSwitch }: FormProps) {
  const id = useId();
  const [errors, setErrors] = useState<FieldErrors<"email" | "password">>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formRef, focusFirstError] = useFocusFirstError();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };
    const nextErrors = validateSignIn(fields);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return focusFirstError();
    setLoading(true);
    const result = await signInMember(fields);
    setLoading(false);
    if (!result.ok) return setFormError(result.message);
    toast(`Welcome back, ${firstName(result.member.name)}.`);
    onDone(result.member);
  };

  const emailValue = () =>
    String(
      formRef.current?.querySelector<HTMLInputElement>("[name=email]")?.value ??
        ""
    );

  return (
    <form
      ref={formRef}
      className="signin-form"
      onSubmit={submit}
      onInput={clearErrorOnInput(setErrors)}
      noValidate
    >
      <span className="eyebrow">MEMBER AREA</span>
      <h1>Welcome back.</h1>
      <p className="auth-lede">
        Sign in to see your bookings and join open play.
      </p>
      <label htmlFor={`${id}-email`}>Email address</label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="alex@example.com"
        defaultValue={initialEmail}
        aria-invalid={errors.email ? true : undefined}
        aria-describedby={`${id}-email-error`}
        required
      />
      <FieldError id={`${id}-email-error`} message={errors.email} />
      <label htmlFor={`${id}-password`}>Password</label>
      <PasswordInput
        id={`${id}-password`}
        invalid={Boolean(errors.password)}
        describedBy={`${id}-password-error`}
      />
      <FieldError id={`${id}-password-error`} message={errors.password} />
      <button
        type="button"
        className="auth-text-link auth-forgot"
        onClick={() =>
          toast(
            "Password reset arrives with the club's member login. Ask the front desk for help in the meantime."
          )
        }
      >
        Forgot password?
      </button>
      <p className="form-error auth-form-error" role="alert">
        {formError}
      </p>
      <button className="dark-button wide" type="submit" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" /> Signing in…
          </>
        ) : (
          <>
            Sign in <ArrowRight size={16} />
          </>
        )}
      </button>
      <p className="auth-switch">
        New to Baseline?{" "}
        <button
          type="button"
          className="auth-text-link"
          onClick={() => onSwitch(emailValue())}
        >
          Create an account
        </button>
      </p>
    </form>
  );
}

type RegisterErrorKey =
  | "name"
  | "email"
  | "password"
  | "confirmPassword"
  | "acceptedTerms";

function RegisterForm({ initialEmail, onDone, onSwitch }: FormProps) {
  const id = useId();
  const [errors, setErrors] = useState<FieldErrors<RegisterErrorKey>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [formRef, focusFirstError] = useFocusFirstError();
  const strength = passwordStrength(password);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
      acceptedTerms: data.get("acceptedTerms") === "on",
    };
    const nextErrors = validateRegistration(fields);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length) return focusFirstError();
    setLoading(true);
    const result = await registerMember(fields);
    setLoading(false);
    if (!result.ok) return setFormError(result.message);
    toast(`You're in, ${firstName(result.member.name)}. Welcome to Baseline.`);
    onDone(result.member);
  };

  const emailValue = () =>
    String(
      formRef.current?.querySelector<HTMLInputElement>("[name=email]")?.value ??
        ""
    );

  return (
    <form
      ref={formRef}
      className="signin-form"
      onSubmit={submit}
      onInput={clearErrorOnInput(setErrors)}
      noValidate
    >
      <span className="eyebrow">JOIN THE CLUB</span>
      <h1>Create your account.</h1>
      <p className="auth-lede">
        One account for court bookings, open play and club news.
      </p>
      <label htmlFor={`${id}-name`}>Full name</label>
      <input
        id={`${id}-name`}
        name="name"
        autoComplete="name"
        placeholder="Alex dela Cruz"
        aria-invalid={errors.name ? true : undefined}
        aria-describedby={`${id}-name-error`}
        required
      />
      <FieldError id={`${id}-name-error`} message={errors.name} />
      <label htmlFor={`${id}-email`}>Email address</label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        placeholder="alex@example.com"
        defaultValue={initialEmail}
        aria-invalid={errors.email ? true : undefined}
        aria-describedby={`${id}-email-error`}
        required
      />
      <FieldError id={`${id}-email-error`} message={errors.email} />
      <label htmlFor={`${id}-password`}>Password</label>
      <PasswordInput
        id={`${id}-password`}
        autoComplete="new-password"
        invalid={Boolean(errors.password)}
        describedBy={`${id}-password-hint ${id}-password-error`}
        onValueChange={setPassword}
      />
      <div
        id={`${id}-password-hint`}
        className={`strength-meter score-${strength.score}`}
      >
        <span className="strength-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          {strength.label ? `${strength.label} · ` : ""}
          {MIN_PASSWORD_LENGTH}+ characters with letters and a number
        </span>
      </div>
      <FieldError id={`${id}-password-error`} message={errors.password} />
      <label htmlFor={`${id}-confirm`}>Confirm password</label>
      <PasswordInput
        id={`${id}-confirm`}
        name="confirmPassword"
        autoComplete="new-password"
        invalid={Boolean(errors.confirmPassword)}
        describedBy={`${id}-confirm-error`}
      />
      <FieldError id={`${id}-confirm-error`} message={errors.confirmPassword} />
      <label className="check-row auth-terms">
        <input
          type="checkbox"
          name="acceptedTerms"
          aria-invalid={errors.acceptedTerms ? true : undefined}
          aria-describedby={`${id}-terms-error`}
        />
        I agree to the club rules and the 12-hour cancellation policy.
      </label>
      <FieldError id={`${id}-terms-error`} message={errors.acceptedTerms} />
      <p className="form-error auth-form-error" role="alert">
        {formError}
      </p>
      <button className="lime-button wide" type="submit" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true" /> Creating account…
          </>
        ) : (
          <>
            Create account <ArrowRight size={16} />
          </>
        )}
      </button>
      <p className="auth-switch">
        Already a member?{" "}
        <button
          type="button"
          className="auth-text-link"
          onClick={() => onSwitch(emailValue())}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
