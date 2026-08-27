"use client";

import { useEffect, useRef, useState } from "react";

/**
 * One field, one name. Used for both trackers and lists — neither asks for
 * anything beyond what it is called.
 */
export default function NameForm({
  id,
  label,
  placeholder,
  submitLabel,
  initial = "",
  autoFocus = false,
  onSubmit,
  onCancel,
}: {
  id: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  initial?: string;
  autoFocus?: boolean;
  onSubmit: (name: string) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = name.trim();

    if (!value) {
      setError("Give it a name.");
      return;
    }

    setSaving(true);
    await onSubmit(value.slice(0, 40));
    setSaving(false);
    setName("");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-wrap items-end gap-4">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="label text-muted">
          {label}
        </label>
        <input
          ref={inputRef}
          id={id}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && onCancel) onCancel();
          }}
          placeholder={placeholder}
          maxLength={40}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-2 w-full rule border-b py-2 text-sm placeholder:text-faint"
        />
        {error ? (
          <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="label rule border px-4 py-2 hover:border-line-strong disabled:text-faint"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="label text-faint hover:text-fg">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
