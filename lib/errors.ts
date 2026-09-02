/**
 * How a failed Supabase call should be handled.
 *
 * - `transient`: the session is fine, the request isn't. Retrying works, and
 *   destroying the session here would strand the user behind an email rate limit.
 * - `stale-token`: the access token is expired or rejected, but the refresh token
 *   can mint a new one silently. No email involved.
 * - `signed-out`: the refresh token itself is gone or revoked. Only now does the
 *   user genuinely need a new sign-in link.
 */
export type FailureKind = "transient" | "stale-token" | "signed-out" | "other";

export type Failure = {
  kind: FailureKind;
  /** Message safe to show in the UI. */
  message: string;
};

function textOf(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const e = error as { message?: unknown; code?: unknown; error_description?: unknown };
    return [e.message, e.code, e.error_description].filter(Boolean).join(" ");
  }
  return String(error);
}

export function classify(error: unknown): Failure {
  const raw = textOf(error);
  const text = raw.toLowerCase();

  // Clock skew on the API instance: the token is valid, the validator disagrees.
  if (text.includes("issued at future") || text.includes("issued in the future")) {
    return {
      kind: "transient",
      message: "Supabase rejected a valid token as too new — a clock issue on their side. Retrying usually clears it.",
    };
  }

  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("load failed") ||
    text.includes("timeout") ||
    text.includes("503") ||
    text.includes("502")
  ) {
    return { kind: "transient", message: "Could not reach the server. Check your connection." };
  }

  // The refresh token is unusable — this is the only case that needs a new link.
  if (
    text.includes("refresh_token_not_found") ||
    text.includes("invalid refresh token") ||
    text.includes("refresh token not found") ||
    text.includes("session_not_found") ||
    text.includes("session from session_id claim in jwt does not exist")
  ) {
    return { kind: "signed-out", message: "Your session ended. Sign in again to continue." };
  }

  // Expired or unacceptable access token — recoverable from the refresh token.
  if (
    text.includes("pgrst301") ||
    text.includes("jwt expired") ||
    text.includes("token is expired") ||
    text.includes("invalid jwt") ||
    text.includes("invalid claim") ||
    text.includes("bad_jwt")
  ) {
    return { kind: "stale-token", message: "Reconnecting…" };
  }

  return { kind: "other", message: raw || "Could not save that change." };
}
