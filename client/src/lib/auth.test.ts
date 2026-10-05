import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACCOUNTS_KEY,
  firstName,
  hashPassword,
  passwordStrength,
  readSession,
  registerMember,
  signInMember,
  signOutMember,
  validateRegistration,
  validateSignIn,
} from "./auth";

const valid = {
  name: "Alex dela Cruz",
  email: "Alex@Example.com ",
  password: "rally2024",
  confirmPassword: "rally2024",
  acceptedTerms: true,
};

describe("validateRegistration", () => {
  it("accepts a complete registration", () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it("flags each missing or invalid field", () => {
    const errors = validateRegistration({
      name: " ",
      email: "alex@",
      password: "short",
      confirmPassword: "",
      acceptedTerms: false,
    });
    expect(Object.keys(errors).sort()).toEqual([
      "acceptedTerms",
      "email",
      "name",
      "password",
    ]);
  });

  it("requires letters and a number, then a matching confirmation", () => {
    expect(
      validateRegistration({ ...valid, password: "abcdefgh" }).password
    ).toBe("Mix letters and at least one number.");
    expect(
      validateRegistration({ ...valid, confirmPassword: "rally2025" })
        .confirmPassword
    ).toBe("Passwords don't match.");
  });
});

describe("validateSignIn", () => {
  it("needs a valid email and a password", () => {
    expect(
      validateSignIn({ email: "alex@example.com", password: "x" })
    ).toEqual({});
    expect(validateSignIn({ email: "nope", password: "" })).toEqual({
      email: "Enter a valid email address.",
      password: "Enter your password.",
    });
  });
});

describe("helpers", () => {
  it("rates password strength", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("abc1").label).toBe("Weak");
    expect(passwordStrength("rally2024").label).toBe("Good");
    expect(passwordStrength("Long-Rally-2024").label).toBe("Strong");
  });

  it("uses the first name for greetings", () => {
    expect(firstName("  Mia   Santos ")).toBe("Mia");
  });

  it("salts password hashes", async () => {
    const a = await hashPassword("rally2024", "salt-a");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPassword("rally2024", "salt-a")).toBe(a);
    expect(await hashPassword("rally2024", "salt-b")).not.toBe(a);
  });
});

describe("demo accounts", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
      dispatchEvent: () => true,
    });
  });

  it("registers, signs out and signs back in", async () => {
    const registered = await registerMember(valid);
    expect(registered.ok).toBe(true);
    expect(readSession()?.email).toBe("alex@example.com");
    expect(window.localStorage.getItem(ACCOUNTS_KEY)).not.toContain(
      "rally2024"
    );

    signOutMember();
    expect(readSession()).toBeNull();

    const signedIn = await signInMember({
      email: "ALEX@example.com",
      password: "rally2024",
    });
    expect(signedIn.ok && signedIn.member.name).toBe("Alex dela Cruz");
  });

  it("rejects duplicate emails and wrong passwords", async () => {
    await registerMember(valid);
    expect((await registerMember(valid)).ok).toBe(false);
    const wrong = await signInMember({
      email: "alex@example.com",
      password: "rally2025",
    });
    const unknown = await signInMember({
      email: "mia@example.com",
      password: "rally2024",
    });
    expect(wrong.ok).toBe(false);
    expect(unknown).toEqual(wrong);
  });
});
