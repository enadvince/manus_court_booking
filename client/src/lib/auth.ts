import { useEffect, useState } from "react";
import { isValidEmail } from "./newsletter";
import { readStorage, writeStorage } from "./storage";

/**
 * Demo-mode member accounts. Until an auth provider is connected, accounts
 * live in this browser's localStorage and passwords are stored as salted
 * SHA-256 digests. This keeps the sign-in and register flows real enough to
 * click through; it is not a substitute for server-side authentication.
 */

export type Member = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};
type StoredAccount = Member & { salt: string; passwordHash: string };

export const ACCOUNTS_KEY = "baseline-accounts";
export const SESSION_KEY = "baseline-session";
const SESSION_EVENT = "baseline:session";
export const MIN_PASSWORD_LENGTH = 8;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;
export type SignInFields = { email: string; password: string };
export type RegisterFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateSignIn(
  fields: SignInFields
): FieldErrors<keyof SignInFields> {
  const errors: FieldErrors<keyof SignInFields> = {};
  if (!isValidEmail(fields.email))
    errors.email = "Enter a valid email address.";
  if (!fields.password) errors.password = "Enter your password.";
  return errors;
}

export function validateRegistration(
  fields: RegisterFields
): FieldErrors<keyof RegisterFields> {
  const errors: FieldErrors<keyof RegisterFields> = {};
  if (fields.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!isValidEmail(fields.email))
    errors.email = "Enter a valid email address.";
  if (fields.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (!/[a-z]/i.test(fields.password) || !/\d/.test(fields.password)) {
    errors.password = "Mix letters and at least one number.";
  }
  if (!errors.password && fields.confirmPassword !== fields.password) {
    errors.confirmPassword = "Passwords don't match.";
  }
  if (!fields.acceptedTerms)
    errors.acceptedTerms = "Accept the club rules to continue.";
  return errors;
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string };

/** A rough guide for the meter under the password field, not a policy. */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "" };
  const meetsPolicy =
    password.length >= MIN_PASSWORD_LENGTH &&
    /[a-z]/i.test(password) &&
    /\d/.test(password);
  if (!meetsPolicy) return { score: 1, label: "Weak" };
  const extras = [
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /[^a-z0-9]/i.test(password),
  ].filter(Boolean).length;
  return extras >= 2
    ? { score: 3, label: "Strong" }
    : { score: 2, label: "Good" };
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${password}`)
  );
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function readAccounts(): StoredAccount[] {
  try {
    const parsed = JSON.parse(readStorage(ACCOUNTS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toMember({ id, name, email, createdAt }: StoredAccount): Member {
  return { id, name, email, createdAt };
}

export function readSession(): Member | null {
  const id = readStorage(SESSION_KEY);
  const account = id ? readAccounts().find(item => item.id === id) : undefined;
  return account ? toMember(account) : null;
}

function setSession(id: string | null) {
  writeStorage(SESSION_KEY, id);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export type AuthResult =
  | { ok: true; member: Member }
  | { ok: false; message: string };

const NOT_SAVED =
  "We couldn't save your account in this browser. Check that site data is allowed and try again.";

export async function registerMember(
  fields: RegisterFields
): Promise<AuthResult> {
  const email = normalizeEmail(fields.email);
  const accounts = readAccounts();
  if (accounts.some(account => account.email === email)) {
    return {
      ok: false,
      message: "An account with that email already exists. Sign in instead.",
    };
  }
  const salt = randomHex(16);
  const account: StoredAccount = {
    id: randomHex(12),
    name: fields.name.trim().replace(/\s+/g, " "),
    email,
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(fields.password, salt),
  };
  writeStorage(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
  if (!readAccounts().some(item => item.id === account.id))
    return { ok: false, message: NOT_SAVED };
  setSession(account.id);
  return { ok: true, member: toMember(account) };
}

export async function signInMember(fields: SignInFields): Promise<AuthResult> {
  const account = readAccounts().find(
    item => item.email === normalizeEmail(fields.email)
  );
  // Same message either way so the form doesn't reveal which emails are registered.
  const rejected = {
    ok: false as const,
    message:
      "That email and password don't match. Try again or create an account.",
  };
  if (!account) return rejected;
  if (
    (await hashPassword(fields.password, account.salt)) !== account.passwordHash
  )
    return rejected;
  setSession(account.id);
  return { ok: true, member: toMember(account) };
}

export function signOutMember() {
  setSession(null);
}

/** The signed-in member, kept in sync across components and browser tabs. */
export function useSession(): Member | null {
  const [member, setMember] = useState(readSession);
  useEffect(() => {
    const update = () => setMember(readSession());
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === SESSION_KEY ||
        event.key === ACCOUNTS_KEY
      )
        update();
    };
    window.addEventListener(SESSION_EVENT, update);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SESSION_EVENT, update);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return member;
}
