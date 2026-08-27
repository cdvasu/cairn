"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { addDays, toKey } from "@/lib/date";
import type { DayLog, List, Todo, Tracker } from "@/lib/types";

/** How far back the heatmaps reach. */
export const HISTORY_DAYS = 364;

type Status = "loading" | "ready" | "error";

/** Which section of a list an item sits in. */
export type Zone = "minimum" | "pending" | "done";

export function zoneOf(todo: Todo): Zone {
  if (todo.done) return "done";
  return todo.is_minimum ? "minimum" : "pending";
}

/**
 * The minimum is what you dragged into the Minimum section. A list with nothing
 * there falls back to "everything on it" so the day still has a finish line.
 */
export function minimumReached(todos: Todo[]): boolean {
  const flagged = todos.filter((t) => t.is_minimum);
  const items = flagged.length > 0 ? flagged : todos;
  return items.length > 0 && items.every((t) => t.done);
}

type State = {
  trackers: Tracker[];
  lists: List[];
  /** Todos keyed by day (`YYYY-MM-DD`); a missing key means "not loaded yet". */
  todosByDay: Record<string, Todo[]>;
  /** `${trackerId}|${day}` for every day a tracker was marked done. */
  dayLogs: Set<string>;
};

const EMPTY: State = { trackers: [], lists: [], todosByDay: {}, dayLogs: new Set() };

export const logKey = (trackerId: string, day: string) => `${trackerId}|${day}`;

type Ctx = {
  userId: string;
  status: Status;
  error: string | null;
  dismissError: () => void;

  trackers: Tracker[];
  hasLog: (trackerId: string, day: string) => boolean;
  addTracker: (name: string) => Promise<void>;
  renameTracker: (id: string, name: string) => Promise<void>;
  deleteTracker: (id: string) => Promise<void>;
  setDayLog: (trackerId: string, day: string, on: boolean) => Promise<void>;

  lists: List[];
  addList: (name: string) => Promise<void>;
  renameList: (id: string, name: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;

  todosFor: (day: string) => Todo[] | undefined;
  addTodo: (listId: string, day: string, title: string) => Promise<void>;
  updateTodo: (id: string, patch: Partial<Todo>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  /** Rewrites one list's three sections in one optimistic write. */
  setListOrder: (
    day: string,
    listId: string,
    zones: Record<Zone, Todo[]>,
  ) => Promise<void>;
};

const DataContext = createContext<Ctx | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}

export function DataProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const supabase = supabaseBrowser();
  const [state, setState] = useState<State>(EMPTY);
  const stateRef = useRef<State>(EMPTY);
  stateRef.current = state;
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const today = toKey(new Date());
  const historyStart = toKey(addDays(new Date(), -HISTORY_DAYS));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [trackers, lists, todos, logs] = await Promise.all([
        supabase.from("trackers").select("*").order("position").order("created_at"),
        supabase.from("lists").select("*").order("position").order("created_at"),
        supabase.from("todos").select("*").eq("day", today).order("position"),
        supabase.from("day_logs").select("*").gte("day", historyStart),
      ]);

      if (cancelled) return;

      const failure = trackers.error ?? lists.error ?? todos.error ?? logs.error;
      if (failure) {
        setError(failure.message);
        setStatus("error");
        return;
      }

      setState({
        trackers: trackers.data ?? [],
        lists: lists.data ?? [],
        todosByDay: { [today]: todos.data ?? [] },
        dayLogs: new Set((logs.data ?? []).map((l: DayLog) => logKey(l.tracker_id, l.day))),
      });
      setStatus("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, today, historyStart]);

  /** Optimistic write: apply locally, then persist; roll back on failure. */
  const commit = useCallback(
    async (apply: (prev: State) => State, persist: () => PromiseLike<{ error: unknown }>) => {
      const snapshot = stateRef.current;
      setState(apply);

      const { error: writeError } = await persist();
      if (writeError) {
        setState(snapshot);
        setError(
          typeof writeError === "object" && writeError && "message" in writeError
            ? String((writeError as { message: unknown }).message)
            : "Could not save that change.",
        );
      }
    },
    [],
  );

  const value = useMemo<Ctx>(() => {
    const nextPosition = <T extends { position: number }>(rows: T[]) =>
      rows.reduce((max, r) => Math.max(max, r.position), -1) + 1;

    return {
      userId,
      status,
      error,
      dismissError: () => setError(null),

      // ---------------------------------------------------------- heatmap
      trackers: state.trackers,
      hasLog: (trackerId, day) => state.dayLogs.has(logKey(trackerId, day)),

      addTracker: async (name) => {
        const row: Tracker = {
          id: crypto.randomUUID(),
          user_id: userId,
          name,
          position: nextPosition(state.trackers),
          created_at: new Date().toISOString(),
        };
        await commit(
          (prev) => ({ ...prev, trackers: [...prev.trackers, row] }),
          () => supabase.from("trackers").insert(row),
        );
      },

      renameTracker: async (id, name) => {
        await commit(
          (prev) => ({
            ...prev,
            trackers: prev.trackers.map((t) => (t.id === id ? { ...t, name } : t)),
          }),
          () => supabase.from("trackers").update({ name }).eq("id", id),
        );
      },

      deleteTracker: async (id) => {
        await commit(
          (prev) => ({
            ...prev,
            trackers: prev.trackers.filter((t) => t.id !== id),
            dayLogs: new Set([...prev.dayLogs].filter((k) => !k.startsWith(`${id}|`))),
          }),
          () => supabase.from("trackers").delete().eq("id", id),
        );
      },

      setDayLog: async (trackerId, day, on) => {
        const key = logKey(trackerId, day);
        await commit(
          (prev) => {
            const dayLogs = new Set(prev.dayLogs);
            if (on) dayLogs.add(key);
            else dayLogs.delete(key);
            return { ...prev, dayLogs };
          },
          () =>
            on
              ? supabase
                  .from("day_logs")
                  .upsert(
                    { user_id: userId, tracker_id: trackerId, day },
                    { onConflict: "tracker_id,day" },
                  )
              : supabase.from("day_logs").delete().eq("tracker_id", trackerId).eq("day", day),
        );
      },

      // ------------------------------------------------------------- todo
      lists: state.lists,

      addList: async (name) => {
        const row: List = {
          id: crypto.randomUUID(),
          user_id: userId,
          name,
          position: nextPosition(state.lists),
          created_at: new Date().toISOString(),
        };
        await commit(
          (prev) => ({ ...prev, lists: [...prev.lists, row] }),
          () => supabase.from("lists").insert(row),
        );
      },

      renameList: async (id, name) => {
        await commit(
          (prev) => ({
            ...prev,
            lists: prev.lists.map((l) => (l.id === id ? { ...l, name } : l)),
          }),
          () => supabase.from("lists").update({ name }).eq("id", id),
        );
      },

      deleteList: async (id) => {
        await commit(
          (prev) => {
            const todosByDay: Record<string, Todo[]> = {};
            for (const [day, list] of Object.entries(prev.todosByDay)) {
              todosByDay[day] = list.filter((t) => t.list_id !== id);
            }
            return { ...prev, lists: prev.lists.filter((l) => l.id !== id), todosByDay };
          },
          () => supabase.from("lists").delete().eq("id", id),
        );
      },

      todosFor: (day) => state.todosByDay[day],

      addTodo: async (listId, day, title) => {
        const row: Todo = {
          id: crypto.randomUUID(),
          user_id: userId,
          list_id: listId,
          day,
          title,
          done: false,
          is_minimum: false,
          position: nextPosition((state.todosByDay[day] ?? []).filter((t) => t.list_id === listId)),
          created_at: new Date().toISOString(),
        };
        await commit(
          (prev) => ({
            ...prev,
            todosByDay: { ...prev.todosByDay, [day]: [...(prev.todosByDay[day] ?? []), row] },
          }),
          () => supabase.from("todos").insert(row),
        );
      },

      updateTodo: async (id, patch) => {
        await commit(
          (prev) => {
            const todosByDay = { ...prev.todosByDay };
            for (const [d, list] of Object.entries(prev.todosByDay)) {
              if (!list.some((t) => t.id === id)) continue;
              todosByDay[d] = list.map((t) => (t.id === id ? { ...t, ...patch } : t));
            }
            return { ...prev, todosByDay };
          },
          () => supabase.from("todos").update(patch).eq("id", id),
        );
      },

      deleteTodo: async (id) => {
        await commit(
          (prev) => {
            const todosByDay = { ...prev.todosByDay };
            for (const [d, list] of Object.entries(prev.todosByDay)) {
              todosByDay[d] = list.filter((t) => t.id !== id);
            }
            return { ...prev, todosByDay };
          },
          () => supabase.from("todos").delete().eq("id", id),
        );
      },

      setListOrder: async (day, listId, zones) => {
        const rows: Todo[] = [];
        for (const item of zones.minimum) rows.push({ ...item, done: false, is_minimum: true });
        for (const item of zones.pending) rows.push({ ...item, done: false, is_minimum: false });
        for (const item of zones.done) rows.push({ ...item, done: true });
        rows.forEach((row, index) => {
          row.position = index;
        });

        const before = state.todosByDay[day] ?? [];
        const changed = rows.filter((row) => {
          const was = before.find((t) => t.id === row.id);
          return (
            !was ||
            was.done !== row.done ||
            was.is_minimum !== row.is_minimum ||
            was.position !== row.position
          );
        });
        if (changed.length === 0) return;

        const merged = before.filter((t) => t.list_id !== listId).concat(rows);
        await commit(
          (prev) => ({ ...prev, todosByDay: { ...prev.todosByDay, [day]: merged } }),
          () => supabase.from("todos").upsert(changed),
        );
      },
    };
  }, [state, status, error, supabase, userId, commit]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
