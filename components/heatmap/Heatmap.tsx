"use client";

import { useEffect, useMemo, useRef } from "react";
import { WEEKDAY_INITIALS, addDays, fromKey, startOfWeek, toKey } from "@/lib/date";

type Props = {
  /** Days the tracker was marked done. */
  isDone: (day: string) => boolean;
  selected: string | null;
  onSelect: (day: string) => void;
  historyDays: number;
  label: string;
};

export default function Heatmap({ isDone, selected, onSelect, historyDays, label }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = toKey(new Date());

  const weeks = useMemo(() => {
    const firstDay = startOfWeek(addDays(new Date(), -historyDays));
    const columns: (string | null)[][] = [];
    let cursor = firstDay;

    while (cursor <= new Date()) {
      const column: (string | null)[] = [];
      for (let i = 0; i < 7; i += 1) {
        const day = addDays(cursor, i);
        column.push(day > new Date() ? null : toKey(day));
      }
      columns.push(column);
      cursor = addDays(cursor, 7);
    }
    return columns;
  }, [historyDays]);

  // Newest weeks matter most: open scrolled to the right edge.
  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [weeks.length]);

  const months = useMemo(
    () =>
      weeks.map((column, index) => {
        const first = column.find(Boolean);
        if (!first) return "";
        const date = fromKey(first);
        const previous = weeks[index - 1]?.find(Boolean);
        if (index > 0 && previous && fromKey(previous).getMonth() === date.getMonth()) return "";
        return date.toLocaleDateString(undefined, { month: "short" });
      }),
    [weeks],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    const deltas: Record<string, number> = {
      ArrowLeft: -7,
      ArrowRight: 7,
      ArrowUp: -1,
      ArrowDown: 1,
    };
    const delta = deltas[event.key];
    if (delta === undefined || !selected) return;

    event.preventDefault();
    const next = addDays(fromKey(selected), delta);
    if (next > new Date()) return;
    const key = toKey(next);

    onSelect(key);
    requestAnimationFrame(() => {
      scroller.current?.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)?.focus();
    });
  }

  return (
    <div className="flex gap-2">
      <div
        className="mt-[18px] flex flex-col justify-between pt-[1px] text-[9px] leading-none text-faint"
        aria-hidden="true"
      >
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span key={index} className="h-[11px]">
            {index % 2 === 1 ? initial : ""}
          </span>
        ))}
      </div>

      <div ref={scroller} className="min-w-0 flex-1 overflow-x-auto pb-1">
        {/* Absolutely placed so a wide month name never distorts the column grid. */}
        <div className="relative h-[14px]" aria-hidden="true" style={{ width: weeks.length * 14 }}>
          {months.map((month, index) =>
            month ? (
              <span
                key={index}
                className="absolute top-0 text-[9px] leading-[14px] whitespace-nowrap text-faint"
                style={{ left: index * 14 }}
              >
                {month}
              </span>
            ) : null,
          )}
        </div>

        <div
          className="flex gap-[3px]"
          role="grid"
          aria-label={`${label} daily continuity`}
          onKeyDown={onKeyDown}
        >
          {weeks.map((column, weekIndex) => (
            <div key={weekIndex} role="row" className="flex flex-col gap-[3px]">
              {column.map((day, dayIndex) =>
                day === null ? (
                  <span key={dayIndex} className="size-[11px]" />
                ) : (
                  <button
                    key={day}
                    type="button"
                    role="gridcell"
                    data-day={day}
                    tabIndex={day === (selected ?? today) ? 0 : -1}
                    aria-selected={day === selected}
                    aria-label={`${day}${isDone(day) ? " — done" : ""}`}
                    onClick={() => onSelect(day)}
                    className={`size-[11px] rule border transition-colors ${
                      isDone(day)
                        ? "border-accent/75 bg-accent/75"
                        : "border-[rgba(255,255,255,0.08)] hover:border-line-strong"
                    } ${day === selected ? "outline outline-offset-1 outline-fg" : ""} ${
                      day === today && day !== selected ? "border-line-strong" : ""
                    }`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
