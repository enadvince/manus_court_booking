const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export type SubscribeResult = { ok: true } | { ok: false; message: string };

/**
 * Posts the address to VITE_NEWSLETTER_ENDPOINT when configured. Without an
 * endpoint the site runs in demo mode (like sign-in) and resolves locally.
 */
export async function subscribeToNewsletter(
  email: string
): Promise<SubscribeResult> {
  const address = email.trim();
  if (!isValidEmail(address)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const endpoint = import.meta.env.VITE_NEWSLETTER_ENDPOINT as
    | string
    | undefined;
  if (!endpoint) {
    await new Promise(resolve => setTimeout(resolve, 700));
    return { ok: true };
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: address }),
    });
    return response.ok
      ? { ok: true }
      : { ok: false, message: "We couldn't sign you up. Please try again." };
  } catch {
    return {
      ok: false,
      message: "Network error. Check your connection and try again.",
    };
  }
}
