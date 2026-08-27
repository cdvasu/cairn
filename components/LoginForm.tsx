"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

const ERRORS: Record<string, string> = {
  link_expired: "That link has expired. Request a new one below.",
  missing_code: "That link was incomplete. Request a new one below.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(ERRORS[params.get("error") ?? ""] ?? null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    setError(null);

    const redirectBase = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: signInError } = await supabaseBrowser().auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${redirectBase}/auth/callback?next=/todo` },
    });

    if (signInError) {
      setStatus("idle");
      setError(signInError.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div>
        <p className="text-sm text-fg">Check your inbox.</p>
        <p className="mt-2 text-sm text-muted">
          A sign-in link is on its way to {email.trim()}. It opens this app directly.
        </p>
        <button
          type="button"
          className="label mt-6 text-faint hover:text-fg"
          onClick={() => setStatus("idle")}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="email" className="label text-muted">
        Email address
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        placeholder="you@example.com"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "email-error" : undefined}
        className="mt-3 w-full rule border-b pb-2 text-sm placeholder:text-faint"
      />

      {error ? (
        <p id="email-error" role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="label mt-8 w-full rule border px-4 py-3 text-fg transition-colors hover:border-line-strong disabled:text-faint"
      >
        {status === "sending" ? "Sending…" : "Send sign-in link"}
      </button>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        No password to remember. We email you a one-time link each time you sign in.
      </p>
    </form>
  );
}
