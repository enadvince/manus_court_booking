import { useId, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CircleAlert,
  ImageUp,
  QrCode,
} from "lucide-react";
import { navigateTo } from "@/lib/navigation";
import { contact } from "@/lib/siteContent";
import type { PaymentMethod } from "@/lib/booking/store";
import {
  validateDetails,
  type DetailErrors,
  type PlayerDetails,
} from "@/lib/booking/validation";
import { onRadioGroupKeyDown } from "./bookingState";

const FIELDS: {
  key: keyof PlayerDetails;
  label: string;
  type: string;
  autoComplete: string;
  inputMode?: "tel" | "email" | "text";
  placeholder: string;
  optional?: boolean;
}[] = [
  {
    key: "name",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    placeholder: "Alex dela Cruz",
  },
  {
    key: "mobile",
    label: "Mobile number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    placeholder: "0917 123 4567",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
    placeholder: "alex@example.com",
  },
  {
    key: "notes",
    label: "Notes for the front desk",
    type: "textarea",
    autoComplete: "off",
    placeholder: "Paddle rental, a coach request…",
    optional: true,
  },
];

export function DetailsForm({
  details,
  onChange,
  onBack,
  onNext,
}: {
  details: PlayerDetails;
  onChange: (details: PlayerDetails) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<DetailErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateDetails(details);
    setErrors(found);
    const keys = Object.keys(found) as (keyof PlayerDetails)[];
    if (keys.length) {
      setAnnouncement(
        `${keys.length} ${keys.length === 1 ? "field needs" : "fields need"} attention. ${keys.map(key => found[key]).join(" ")}`
      );
      form.current?.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      return;
    }
    setAnnouncement("");
    onNext();
  };
  return (
    <form ref={form} className="checkout-form" onSubmit={submit} noValidate>
      {FIELDS.map(field => {
        const inputId = `${id}-${field.key}`;
        const errorId = `${inputId}-error`;
        const error = errors[field.key];
        const common = {
          id: inputId,
          name: field.key,
          value: details[field.key],
          autoComplete: field.autoComplete,
          placeholder: field.placeholder,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? errorId : undefined,
          onChange: (
            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => {
            onChange({ ...details, [field.key]: event.target.value });
            if (error) setErrors(({ [field.key]: _, ...rest }) => rest);
          },
        };
        return (
          <div className={`field ${error ? "has-error" : ""}`} key={field.key}>
            <label htmlFor={inputId}>
              {field.label}
              {field.optional && (
                <span className="field-optional"> (optional)</span>
              )}
            </label>
            {field.type === "textarea" ? (
              <textarea {...common} rows={2} maxLength={300} />
            ) : (
              <input
                {...common}
                type={field.type}
                inputMode={field.inputMode}
                required={!field.optional}
              />
            )}
            {error && (
              <p className="field-error" id={errorId}>
                <CircleAlert size={14} aria-hidden="true" /> {error}
              </p>
            )}
          </div>
        );
      })}
      <p className="sr-only" role="status" aria-live="assertive">
        {announcement}
      </p>
      <div className="checkout-actions">
        <button type="button" className="outline-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="submit" className="dark-button">
          Review booking <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}

/** Downscales a payment screenshot so it fits in demo storage. */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.72);
}

/** A placeholder QR code until the club's real payment QR is supplied. */
function DemoQr() {
  const size = 21;
  const finder = (x: number, y: number) =>
    [0, size - 7].some(ox =>
      [0, size - 7].some(
        oy => !(ox && oy) && x >= ox && x < ox + 7 && y >= oy && y < oy + 7
      )
    );
  const cells: ReactNode[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (finder(x, y)) continue;
      if ((x * 7 + y * 13 + x * y) % 3 === 0)
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" />
    </g>
  );
  return (
    <svg
      className="demo-qr"
      viewBox="-1 -1 23 23"
      role="img"
      aria-label="Sample payment QR code"
    >
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      <g fill="#17211F">
        {cells}
        {eye(0, 0)}
        {eye(size - 7, 0)}
        {eye(0, size - 7)}
      </g>
    </svg>
  );
}

export function PaymentPicker({
  method,
  onMethod,
  proof,
  onProof,
  error,
}: {
  method: PaymentMethod;
  onMethod: (method: PaymentMethod) => void;
  proof: string | null;
  onProof: (proof: string | null) => void;
  error: string | null;
}) {
  const id = useId();
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const options: {
    value: PaymentMethod;
    label: string;
    detail: string;
    icon: typeof Banknote;
  }[] = [
    {
      value: "cash",
      label: "Cash at the front desk",
      detail: "Pay when you arrive",
      icon: Banknote,
    },
    {
      value: "qr",
      label: "QR payment",
      detail: "GCash or Maya, then upload a screenshot",
      icon: QrCode,
    },
  ];
  const shownError = fileError ?? error;
  return (
    <fieldset className="payment-picker">
      <legend className="summary-label">HOW YOU'LL PAY</legend>
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="payment-options"
        onKeyDown={onRadioGroupKeyDown}
      >
        {options.map(({ value, label, detail, icon: Icon }) => {
          const checked = method === value;
          return (
            <button
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              key={value}
              className={`choice-card ${checked ? "is-checked" : ""}`}
              onClick={() => onMethod(value)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <span className="choice-check" aria-hidden="true">
                {checked && <Check size={14} />}
              </span>
            </button>
          );
        })}
      </div>
      {method === "cash" ? (
        <p className="payment-note">
          Bring cash to the front desk. Please arrive 10 minutes early so you
          start on time.
        </p>
      ) : (
        <div className="qr-panel">
          <DemoQr />
          <div>
            <p className="payment-note">
              Scan to pay <strong>Baseline Pickle Club</strong> ({contact.phone}
              ), then upload the screenshot. The host checks it and confirms
              your payment.
            </p>
            <p className="demo-flag">
              Sample QR for this demo. No money moves.
            </p>
            <label
              className={`upload-button ${proof ? "has-file" : ""}`}
              htmlFor={`${id}-proof`}
            >
              {reading ? (
                <span className="spinner" aria-hidden="true" />
              ) : proof ? (
                <Check size={16} />
              ) : (
                <ImageUp size={16} />
              )}
              {proof
                ? "Screenshot added. Replace"
                : "Upload payment screenshot"}
            </label>
            <input
              id={`${id}-proof`}
              className="sr-only"
              type="file"
              accept="image/*"
              aria-invalid={shownError ? true : undefined}
              aria-describedby={shownError ? `${id}-proof-error` : undefined}
              onChange={async event => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  setFileError(
                    "Choose an image file, like a PNG or JPG screenshot."
                  );
                  return;
                }
                setReading(true);
                setFileError(null);
                try {
                  onProof(await shrinkImage(file));
                } catch {
                  setFileError(
                    "We couldn't read that image. Try another screenshot."
                  );
                } finally {
                  setReading(false);
                }
              }}
            />
            {proof && (
              <img
                className="proof-preview"
                src={proof}
                alt="Your payment screenshot"
              />
            )}
            {shownError && (
              <p className="field-error" id={`${id}-proof-error`} role="alert">
                <CircleAlert size={14} aria-hidden="true" /> {shownError}
              </p>
            )}
          </div>
        </div>
      )}
      <p className="policy-note">
        Free cancellation up to 12 hours before you play.{" "}
        <button
          type="button"
          className="inline-link"
          onClick={() => navigateTo({ area: "public", view: "policies" })}
        >
          Booking policies
        </button>
      </p>
    </fieldset>
  );
}
