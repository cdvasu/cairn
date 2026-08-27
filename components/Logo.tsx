/**
 * A cairn: stones stacked one at a time to mark a path. Each stone is a day.
 */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true" focusable="false">
      <rect x="1.5" y="13.6" width="17" height="3.9" rx="1.2" fill="currentColor" />
      <rect x="4" y="8.3" width="12" height="3.9" rx="1.2" fill="currentColor" />
      <rect x="6.5" y="3" width="7" height="3.9" rx="1.2" className="fill-accent" />
    </svg>
  );
}

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Mark className="size-5 shrink-0 text-fg" />
      <span className="text-lg leading-none font-semibold tracking-[0.02em] italic sm:text-xl">
        CAIRN
      </span>
    </span>
  );
}
