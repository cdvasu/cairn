"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useData } from "@/components/DataProvider";
import PageState from "@/components/PageState";
import { formatLong, relativeLabel, todayKey } from "@/lib/date";
import type { JournalEntry } from "@/lib/types";

const ENTRY_LIMIT = 60;
const SAVE_DELAY = 700;

export default function JournalPage() {
  const supabase = supabaseBrowser();
  const { userId } = useData();
  const day = todayKey();

  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("journal_entries")
      .select("*")
      .order("day", { ascending: false })
      .limit(ENTRY_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus("error");
          return;
        }
        setEntries(data ?? []);
        setDraft((data ?? []).find((e) => e.day === day)?.content ?? "");
        setStatus("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, day]);

  const save = useCallback(
    async (content: string) => {
      setSaveState("saving");
      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
          { user_id: userId, day, content, updated_at: new Date().toISOString() },
          { onConflict: "user_id,day" },
        )
        .select()
        .single();

      if (error) {
        setSaveState("error");
        return;
      }

      setSaveState("saved");
      setEntries((prev) => {
        const rest = (prev ?? []).filter((e) => e.day !== day);
        return data ? [data, ...rest] : rest;
      });
    },
    [supabase, userId, day],
  );

  function onChange(value: string) {
    setDraft(value);
    setSaveState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(value), SAVE_DELAY);
  }

  // Flush a pending save when the tab goes away.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const past = useMemo(
    () => (entries ?? []).filter((e) => e.day !== day && e.content.trim().length > 0),
    [entries, day],
  );

  if (status === "loading") return <PageState kind="loading" />;
  if (status === "error") return <PageState kind="error" />;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="rule flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="label text-faint">Journal</p>
          <h1 className="mt-2 text-xl tracking-[-0.01em] sm:text-2xl">{formatLong(day)}</h1>
        </div>
        <p className="label h-4 text-faint" aria-live="polite">
          {saveState === "saving" ? "Saving…" : null}
          {saveState === "saved" ? "Saved" : null}
          {saveState === "error" ? <span className="text-danger">Not saved</span> : null}
        </p>
      </header>

      <div className="rule grid border-b lg:grid-cols-2">
        <section className="rule border-b p-5 sm:p-8 lg:border-r lg:border-b-0">
          <label htmlFor="journal" className="text-sm text-muted">
            What did you do today?
          </label>
          <textarea
            id="journal"
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              if (timer.current) clearTimeout(timer.current);
              void save(draft);
            }}
            maxLength={10000}
            rows={12}
            placeholder="A line is enough."
            className="mt-4 w-full text-sm leading-relaxed placeholder:text-faint"
          />
        </section>

        <section className="p-5 sm:p-8">
          <p className="label text-faint">Previously</p>

          {past.length === 0 ? (
            <p className="mt-4 text-xs text-faint">
              Past entries appear here, newest first. One entry per day.
            </p>
          ) : (
            <ol className="mt-4 max-h-[28rem] space-y-5 overflow-y-auto pr-2">
              {past.map((entry) => (
                <li key={entry.id} className="rule border-b pb-5 last:border-b-0">
                  <p className="label text-faint">
                    {relativeLabel(entry.day) ?? formatLong(entry.day)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-muted">
                    {entry.content}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
