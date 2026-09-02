export default function PageState({
  kind,
  title,
  body,
  action,
  detail,
  onRetry,
}: {
  kind: "loading" | "error" | "empty";
  title?: string;
  body?: string;
  action?: React.ReactNode;
  detail?: string;
  onRetry?: () => void;
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
      <div className="mx-auto max-w-md py-20 text-center" role="alert">
        <p className="text-sm text-danger">Could not load your data.</p>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          {detail ?? "Check your connection and try again."}
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="label mt-8 rule border px-4 py-2 hover:border-line-strong"
          >
            Try again
          </button>
        ) : null}
        <p className="mt-6 text-xs text-faint">You are still signed in.</p>
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
