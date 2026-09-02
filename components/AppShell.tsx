"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useData } from "@/components/DataProvider";
import Logo from "@/components/Logo";

const TABS = [
  { href: "/heatmap", label: "Heatmap" },
  { href: "/todo", label: "Todo" },
  { href: "/journal", label: "Journal" },
];

export default function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { failure, dismissFailure, retry } = useData();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 bg-ink/95 backdrop-blur-sm">
        <div className="rule flex items-stretch border-b">
          <Link href="/todo" className="flex flex-1 items-center px-5 py-4 sm:px-8 sm:py-5">
            <Logo />
          </Link>

          <nav aria-label="Sections" className="hidden sm:flex">
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`label rule flex items-center border-l px-6 transition-colors lg:px-10 ${
                    active ? "text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  <span className={active ? "border-b border-accent pb-0.5" : "pb-0.5"}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={signOut}
              title={email}
              className="label rule flex items-center border-l px-6 text-faint transition-colors hover:text-fg"
            >
              Sign out
            </button>
          </nav>
        </div>

        {/* Mobile section switcher */}
        <nav aria-label="Sections" className="rule flex border-b sm:hidden">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`label rule flex-1 border-r py-3 text-center last:border-r-0 ${
                  active ? "text-fg" : "text-muted"
                }`}
              >
                <span className={active ? "border-b border-accent pb-0.5" : ""}>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {failure ? (
        <div
          role="alert"
          className="rule flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-danger/40 bg-danger/5 px-5 py-3 sm:px-8"
        >
          <p className="text-xs text-danger">{failure.message}</p>
          <span className="flex items-center gap-5">
            {failure.kind === "transient" ? (
              <button
                type="button"
                onClick={retry}
                className="text-[10px] tracking-[0.1em] uppercase text-fg hover:text-accent"
              >
                Retry
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismissFailure}
              className="text-[10px] tracking-[0.1em] uppercase text-faint hover:text-fg"
            >
              Dismiss
            </button>
          </span>
        </div>
      ) : null}

      <main className="px-5 py-8 sm:px-8 sm:py-12">{children}</main>

      <footer className="rule mt-8 border-t px-5 py-6 sm:px-8">
        <p className="label text-faint">Continuity over perfection.</p>
        <button
          type="button"
          onClick={signOut}
          className="label mt-4 text-faint hover:text-fg sm:hidden"
        >
          Sign out
        </button>
      </footer>
    </div>
  );
}
