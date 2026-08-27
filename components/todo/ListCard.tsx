"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useData, minimumReached, zoneOf, type Zone } from "@/components/DataProvider";
import TodoRow from "@/components/todo/TodoRow";
import NameForm from "@/components/NameForm";
import type { List, Todo } from "@/lib/types";

const ZONES: Zone[] = ["minimum", "pending", "done"];

function Section({
  id,
  label,
  hint,
  items,
  accent,
  children,
}: {
  id: Zone;
  label: string;
  hint: React.ReactNode;
  items: Todo[];
  accent?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div>
      <p className={`label ${accent ? "text-accent/70" : "text-faint"}`}>{label}</p>
      <ul
        ref={setNodeRef}
        className={`mt-2 rule border transition-colors ${
          isOver ? "border-line-strong" : accent ? "border-accent/25" : ""
        } ${items.length === 0 ? "border-dashed" : ""}`}
      >
        {items.length === 0 ? <li className="px-3 py-2 text-xs text-faint">{hint}</li> : children}
      </ul>
    </div>
  );
}

export default function ListCard({ list, day }: { list: List; day: string }) {
  const { todosFor, addTodo, updateTodo, deleteTodo, setListOrder, renameList, deleteList } =
    useData();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const todos = useMemo(
    () => (todosFor(day) ?? []).filter((t) => t.list_id === list.id),
    [todosFor, day, list.id],
  );

  const zones = useMemo(() => {
    const grouped: Record<Zone, Todo[]> = { minimum: [], pending: [], done: [] };
    for (const todo of [...todos].sort((a, b) => a.position - b.position)) {
      grouped[zoneOf(todo)].push(todo);
    }
    return grouped;
  }, [todos]);

  const reached = minimumReached(todos);
  const minimumTotal = todos.filter((t) => t.is_minimum).length;
  const minimumDone = todos.filter((t) => t.is_minimum && t.done).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function zoneFor(id: string): Zone | null {
    if ((ZONES as string[]).includes(id)) return id as Zone;
    const found = todos.find((t) => t.id === id);
    return found ? zoneOf(found) : null;
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;

    const from = zoneFor(String(active.id));
    const to = zoneFor(String(over.id));
    if (!from || !to) return;

    const next: Record<Zone, Todo[]> = {
      minimum: [...zones.minimum],
      pending: [...zones.pending],
      done: [...zones.done],
    };

    if (from === to) {
      const oldIndex = next[from].findIndex((t) => t.id === active.id);
      const newIndex = next[from].findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      next[from] = arrayMove(next[from], oldIndex, newIndex);
    } else {
      const item = next[from].find((t) => t.id === active.id);
      if (!item) return;
      next[from] = next[from].filter((t) => t.id !== active.id);
      const overIndex = next[to].findIndex((t) => t.id === over.id);
      next[to].splice(overIndex === -1 ? next[to].length : overIndex, 0, item);
    }

    void setListOrder(day, list.id, next);
  }

  function submitDraft(event: React.FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    void addTodo(list.id, day, title.slice(0, 200));
  }

  const row = (todo: Todo) => (
    <TodoRow
      key={todo.id}
      todo={todo}
      onToggleDone={(value) => void updateTodo(todo.id, { done: value })}
      onToggleMinimum={(value) => void updateTodo(todo.id, { is_minimum: value })}
      onRename={(title) => void updateTodo(todo.id, { title })}
      onDelete={() => void deleteTodo(todo.id)}
    />
  );

  return (
    <section className="rule min-w-0 border-b p-5 sm:border-r sm:p-8">
      <header className="flex items-center justify-between gap-4">
        {editing ? (
          <div className="min-w-0 flex-1">
            <NameForm
              id={`rename-list-${list.id}`}
              label="Name"
              placeholder={list.name}
              submitLabel="Save"
              initial={list.name}
              autoFocus
              onSubmit={async (name) => {
                await renameList(list.id, name);
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        ) : (
          <>
            <h2 className="truncate text-base font-medium tracking-[-0.01em]">{list.name}</h2>
            <p className="label shrink-0 text-faint">
              {minimumTotal > 0 ? `Minimum ${minimumDone}/${minimumTotal}` : null}
            </p>
          </>
        )}
      </header>

      <form onSubmit={submitDraft} className="mt-4">
        <label htmlFor={`add-${list.id}`} className="sr-only">
          Add an item to {list.name}
        </label>
        <input
          id={`add-${list.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item…"
          maxLength={200}
          className="w-full rule border-b py-2 text-sm placeholder:text-faint"
        />
      </form>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <div className="mt-5 space-y-4">
          <p className="label text-faint">Pending</p>

          {/* Minimum sits inside Pending: the part of today that has to happen. */}
          <div className="rule ml-3 border-l pl-4">
            <Section
              id="minimum"
              label="Minimum"
              accent
              hint={
                minimumTotal > 0
                  ? "All of it is done."
                  : "Drag an item here to make it the minimum."
              }
              items={zones.minimum}
            >
              <SortableContext
                items={zones.minimum.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {zones.minimum.map(row)}
              </SortableContext>
            </Section>

            <div className="mt-4">
              <Section
                id="pending"
                label="Everything else"
                hint="Nothing pending."
                items={zones.pending}
              >
                <SortableContext
                  items={zones.pending.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {zones.pending.map(row)}
                </SortableContext>
              </Section>
            </div>
          </div>

          <Section id="done" label="Done" hint="Nothing yet today." items={zones.done}>
            <SortableContext
              items={zones.done.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {zones.done.map(row)}
            </SortableContext>
          </Section>
        </div>
      </DndContext>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-xs">
          {reached ? (
            <span className="text-accent">Minimum reached · Keep going.</span>
          ) : (
            <span className="text-faint">Any amount counts.</span>
          )}
        </p>

        {confirmDelete ? (
          <span className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => void deleteList(list.id)}
              className="text-[10px] tracking-[0.1em] uppercase text-danger"
            >
              Delete list
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] tracking-[0.1em] uppercase text-faint hover:text-fg"
            >
              Cancel
            </button>
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-3">
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
          </span>
        )}
      </div>
    </section>
  );
}
