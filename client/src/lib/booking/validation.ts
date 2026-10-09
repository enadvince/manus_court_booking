import { isValidEmail } from "../newsletter";

export type PlayerDetails = {
  name: string;
  mobile: string;
  email: string;
  notes: string;
};

export type DetailErrors = Partial<Record<keyof PlayerDetails, string>>;

/** "0917 123 4567", "+63 917-123-4567" and "639171234567" become "+639171234567". */
export function normalizePhMobile(value: string): string | null {
  const digits = value.replace(/[\s().-]/g, "");
  const match = digits.match(/^(?:\+?63|0)?(9\d{9})$/);
  return match ? `+63${match[1]}` : null;
}

export function validateDetails(details: PlayerDetails): DetailErrors {
  const errors: DetailErrors = {};
  if (details.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!normalizePhMobile(details.mobile))
    errors.mobile = "Enter a PH mobile number, like 0917 123 4567.";
  if (!isValidEmail(details.email))
    errors.email = "Enter a valid email address.";
  if (details.notes.length > 300)
    errors.notes = "Keep notes under 300 characters.";
  return errors;
}
