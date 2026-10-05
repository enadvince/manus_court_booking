import { useId, useState, type FormEvent, type ReactNode } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as Dialog from "@radix-ui/react-dialog";
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/newsletter";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
};

/** Asks before anything destructive. Focus starts on the safe choice. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Keep it",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="dialog-overlay" />
        <AlertDialog.Content className="dialog-panel confirm-panel">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description className="dialog-description">
            {description}
          </AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel className="outline-button">
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action className="danger-button" onClick={onConfirm}>
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function PasswordInput({
  id,
  autoComplete = "current-password",
  invalid = false,
  describedBy,
}: {
  id: string;
  autoComplete?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password-field">
      <input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        required
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible(value => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={id}
      >
        {visible ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </span>
  );
}

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    if (!isValidEmail(email)) return setError("Enter a valid email address.");
    if (!password) return setError("Enter your password.");
    setError("");
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setLoading(false);
    onOpenChange(false);
    toast("Member login is ready for your auth provider.");
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={value => {
        if (!value) setError("");
        onOpenChange(value);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel signin-panel">
          <Dialog.Close className="dialog-close icon-button" aria-label="Close">
            <X size={18} />
          </Dialog.Close>
          <span className="eyebrow">MEMBER AREA</span>
          <Dialog.Title>Welcome back.</Dialog.Title>
          <Dialog.Description className="dialog-description">
            Sign in to see your bookings and join open play.
          </Dialog.Description>
          <form className="signin-form" onSubmit={submit} noValidate>
            <label htmlFor={`${id}-email`}>Email address</label>
            <input
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="alex@example.com"
              aria-invalid={error.startsWith("Enter a valid") || undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              required
            />
            <label htmlFor={`${id}-password`}>Password</label>
            <PasswordInput
              id={`${id}-password`}
              invalid={error === "Enter your password."}
              describedBy={error ? `${id}-error` : undefined}
            />
            <p id={`${id}-error`} className="form-error" role="alert">
              {error}
            </p>
            <button
              className="dark-button wide"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
