"use client";

import { useMemo, useState } from "react";
import { useData, minimumReached } from "@/components/DataProvider";
import ListCard from "@/components/todo/ListCard";
import NameForm from "@/components/NameForm";
import PageState from "@/components/PageState";
import { formatLong, todayKey } from "@/lib/date";

export default function TodoPage() {
  const { status, lists, todosFor, addList } = useData();
  const [adding, setAdding] = useState(false);
  const day = todayKey();
  const todos = todosFor(day);

  const summary = useMemo(() => {
    const items = todos ?? [];
    const withItems = lists.filter((l) => items.some((t) => t.list_id === l.id));

    return {
      total: items.length,
      completed: items.filter((t) => t.done).length,
      allMinimums:
        withItems.length > 0 &&
        withItems.every((l) => minimumReached(items.filter((t) => t.list_id === l.id))),
      hasItems: items.length > 0,
    };
  }, [todos, lists]);

  if (status === "loading" || !todos) return <PageState kind="loading" />;
  if (status === "error") return <PageState kind="error" />;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="rule flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="label text-faint">Today</p>
          <h1 className="mt-2 text-xl tracking-[-0.01em] sm:text-2xl">{formatLong(day)}</h1>
        </div>

        <div className="flex items-end gap-6">
          <div className="text-right">
            <p className="text-sm text-muted" aria-live="polite">
              {summary.completed} / {summary.total} completed
            </p>
            <p className="label mt-1 h-4">
              {summary.allMinimums ? (
                <span className="text-accent">Today is done.</span>
              ) : summary.hasItems ? (
                <span className="text-faint">Keep going.</span>
              ) : (
                <span className="text-faint">Start again today.</span>
              )}
            </p>
          </div>

          {lists.length > 0 && !adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="label rule border px-4 py-2 hover:border-line-strong"
            >
              New list
            </button>
          ) : null}
        </div>
      </header>

      {adding ? (
        <div className="rule border-b p-5 sm:p-8">
          <NameForm
            id="new-list"
            label="List name"
            placeholder="DSA"
            submitLabel="Add list"
            autoFocus
            onSubmit={async (name) => {
              await addList(name);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}

      {lists.length === 0 ? (
        adding ? null : (
          <PageState
            kind="empty"
            title="No lists yet."
            body="Group today's items however you think about them. Add a few, then drag the ones that have to happen into Minimum."
            action={
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="label rule border px-4 py-2 hover:border-line-strong"
              >
                Add your first list
              </button>
            }
          />
        )
      ) : (
        <div className="rule grid border-b sm:grid-cols-2 [&>section:last-child]:border-b-0 sm:[&>section:nth-child(2n)]:border-r-0">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}
