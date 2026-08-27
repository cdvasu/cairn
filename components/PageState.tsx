export default function PageState({
  kind,
  title,
  body,
  action,
}: {
  kind: "loading" | "error" | "empty";
  title?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  if (kind === "loading") {
    return (
      <div className="mx-auto max-w-6xl py-20 text-center" role="status" aria-live="polite">
        <p className="label text-faint">Loading…</p>
      </div>
    );
  }

  if (kind === "error") {
    return (
      <div className="mx-auto max-w-6xl py-20 text-center" role="alert">
        <p className="text-sm text-danger">Something went wrong loading your data.</p>
        <p className="mt-2 text-xs text-faint">Check your connection and reload the page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-sm text-fg">{title}</p>
      {body ? <p className="mt-3 text-xs leading-relaxed text-faint">{body}</p> : null}
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );
}
