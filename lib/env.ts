function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const SUPABASE_URL = () => {
  const raw = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
    .trim()
    .replace(/\/+$/, "");

  // The client appends its own paths (/auth/v1, /rest/v1). Anything but the bare
  // origin here produces confusing gateway errors at sign-in, so reject it loudly.
  const { origin, pathname } = new URL(raw);
  if (pathname !== "/") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be the project URL with no path — use ${origin}, not ${raw}.`,
    );
  }

  return origin;
};

export const SUPABASE_ANON_KEY = () =>
  required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).trim();
