"use client";

import { useState } from "react";
import { HISTORY_DAYS, useData } from "@/components/DataProvider";
import Heatmap from "@/components/heatmap/Heatmap";
import NameForm from "@/components/NameForm";
import { formatLong, relativeLabel, todayKey } from "@/lib/date";
import type { Tracker } from "@/lib/types";

export default function TrackerCard({ tracker }: { tracker: Tracker }) {
  const { hasLog, setDayLog, renameTracker, deleteTracker } = useData();
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const today = todayKey();
  const doneToday = hasLog(tracker.id, today);
  const day = selected ?? today;
  const dayDone = hasLog(tracker.id, day);

  return (
    <section className="rule min-w-0 border-b p-5 sm:border-r sm:p-8">
      <header className="flex items-center justify-between gap-4">
        {editing ? (
          <div className="min-w-0 flex-1">
            <NameForm
              id={`rename-${tracker.id}`}
              label="Name"
              placeholder={tracker.name}
              submitLabel="Save"
              initial={tracker.name}
              autoFocus
              onSubmit={async (name) => {
                await renameTracker(tracker.id, name);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <>
            <h2 className="truncate text-base font-medium tracking-[-0.01em]">{tracker.name}</h2>
            <button
              type="button"
              onClick={() => void setDayLog(tracker.id, today, !doneToday)}
              aria-pressed={doneToday}
              className={`label shrink-0 rule border px-3 py-1.5 transition-colors ${
                doneToday
                  ? "border-accent/60 text-accent"
                  : "text-muted hover:border-line-strong hover:text-fg"
              }`}
            >
              {doneToday ? "Done today" : "Mark today"}
            </button>
          </>
        )}
      </header>

      <div className="mt-6">
        <Heatmap
          label={tracker.name}
          historyDays={HISTORY_DAYS}
          isDone={(d) => hasLog(tracker.id, d)}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      <div className="rule mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        {selected ? (
          <>
            <p className="text-sm">
              {relativeLabel(selected) ?? formatLong(selected)}
              <span className={`ml-3 text-xs ${dayDone ? "text-accent" : "text-faint"}`}>
                {dayDone ? "Done" : "Nothing recorded"}
              </span>
            </p>
            <button
              type="button"
              onClick={() => void setDayLog(tracker.id, selected, !dayDone)}
              className="label rule border px-3 py-1 text-muted hover:border-line-strong hover:text-fg"
            >
              {dayDone ? "Undo" : "Mark done"}
            </button>
          </>
        ) : (
          <p className="text-xs text-faint">
            Pick a day to mark it. Missed days stay blank — start again today.
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        {confirmDelete ? (
          <>
            <p className="text-xs text-muted">Delete {tracker.name} and its history?</p>
            <button
              type="button"
              onClick={() => void deleteTracker(tracker.id)}
              className="text-[10px] tracking-[0.1em] uppercase text-danger"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] tracking-[0.1em] uppercase text-faint hover:text-fg"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-[10px] tracking-[0.1em] uppercase text-faint hover:text-fg"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-[10px] tracking-[0.1em] uppercase text-faint hover:text-danger"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </section>
  );
}
