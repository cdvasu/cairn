import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import { Mark } from "@/components/Logo";

export const metadata = { title: "Sign in — Cairn" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Mark className="size-8 text-fg" />
        <h1 className="mt-6 text-[2rem] leading-none font-semibold tracking-[0.02em] italic">
          CAIRN
        </h1>
        <p className="label mt-4 text-muted">Continuity over perfection.</p>

        <div className="mt-10 rule border-t pt-8">
          <Suspense fallback={<div className="label text-faint">Loading…</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
