"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Todo } from "@/lib/types";

type Props = {
  todo: Todo;
  onToggleDone: (done: boolean) => void;
  onToggleMinimum: (isMinimum: boolean) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
};

export default function TodoRow({
  todo,
  onToggleDone,
  onToggleMinimum,
  onRename,
  onDelete,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function save() {
    const value = draft.trim();
    setEditing(false);
    if (!value) {
      setDraft(todo.title);
      return;
    }
    if (value !== todo.title) onRename(value);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`group rule flex items-center gap-2 border-b px-3 py-2 last:border-b-0 ${
        isDragging ? "relative z-10 bg-panel opacity-90" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${todo.title}`}
        className="shrink-0 cursor-grab px-1 text-faint transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 active:cursor-grabbing"
      >
        <svg width="8" height="14" viewBox="0 0 8 14" aria-hidden="true" fill="currentColor">
          <circle cx="1.5" cy="2" r="1.2" />
          <circle cx="6.5" cy="2" r="1.2" />
          <circle cx="1.5" cy="7" r="1.2" />
          <circle cx="6.5" cy="7" r="1.2" />
          <circle cx="1.5" cy="12" r="1.2" />
          <circle cx="6.5" cy="12" r="1.2" />
        </svg>
      </button>

      <button
        type="button"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.title}
        onClick={() => onToggleDone(!todo.done)}
        className={`grid size-4 shrink-0 place-items-center rule border transition-colors ${
          todo.done ? "border-accent bg-accent/20 text-accent" : "hover:border-line-strong"
        }`}
      >
        {todo.done ? (
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
            <path
              d="M1 5.2 3.8 8 9 1.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setDraft(todo.title);
              setEditing(false);
            }
          }}
          maxLength={200}
          className="min-w-0 flex-1 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(todo.title);
            setEditing(true);
          }}
          className={`min-w-0 flex-1 text-left text-sm break-words ${
            todo.done ? "text-faint line-through" : "text-fg"
          }`}
        >
          {todo.title}
        </button>
      )}

      <button
        type="button"
        aria-pressed={todo.is_minimum}
        onClick={() => onToggleMinimum(!todo.is_minimum)}
        title={todo.is_minimum ? "Remove from the minimum" : "Move into the minimum"}
        className={`shrink-0 px-1 text-[10px] tracking-[0.1em] uppercase transition-opacity ${
          todo.is_minimum
            ? "text-muted"
            : "text-faint sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        }`}
      >
        Min
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${todo.title}`}
        className="shrink-0 px-1 text-faint transition-opacity hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </li>
  );
}
