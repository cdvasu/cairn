"use client";

import { useState } from "react";
import { useData } from "@/components/DataProvider";
import TrackerCard from "@/components/heatmap/TrackerCard";
import NameForm from "@/components/NameForm";
import PageState from "@/components/PageState";

export default function HeatmapPage() {
  const { status, trackers, addTracker, failure, retry } = useData();
  const [adding, setAdding] = useState(false);

  if (status === "error")
    return <PageState kind="error" detail={failure?.message} onRetry={retry} />;
  if (status === "loading") return <PageState kind="loading" />;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="rule flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="label text-faint">Heatmap</p>
          <h1 className="mt-2 text-xl tracking-[-0.01em] sm:text-2xl">Your last year</h1>
        </div>
        {trackers.length > 0 && !adding ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="label rule border px-4 py-2 hover:border-line-strong"
          >
            New tracker
          </button>
        ) : null}
      </header>

      {adding ? (
        <div className="rule border-b p-5 sm:p-8">
          <NameForm
            id="new-tracker"
            label="Tracker name"
            placeholder="Gym"
            submitLabel="Add tracker"
            autoFocus
            onSubmit={async (name) => {
              await addTracker(name);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}

      {trackers.length === 0 ? (
        adding ? null : (
          <PageState
            kind="empty"
            title="Nothing tracked yet."
            body="Name a thing you want to keep returning to. Mark the days you do it — that is the whole mechanism."
            action={
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="label rule border px-4 py-2 hover:border-line-strong"
              >
                Add your first tracker
              </button>
            }
          />
        )
      ) : (
        <div className="rule grid border-b lg:grid-cols-2 [&>section:last-child]:border-b-0 lg:[&>section:nth-child(2n)]:border-r-0">
          {trackers.map((tracker) => (
            <TrackerCard key={tracker.id} tracker={tracker} />
          ))}
        </div>
      )}
    </div>
  );
}
