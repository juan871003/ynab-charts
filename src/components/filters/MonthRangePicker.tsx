import { useEffect, useRef, useState, type ReactNode } from "react";
import { format } from "date-fns";
import type { DateRange } from "@/lib/aggregate";
import {
  applyPreset,
  dateRangeToMonthKeys,
  isFullDataRange,
  monthKeysToClippedRange,
  parseMonthKey,
  shiftMonthRangeByStep,
  type MonthKey,
  type MonthRangePresetId,
} from "@/lib/monthRange";
import { MonthYearSelect } from "@/components/filters/MonthYearSelect";

function calendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function chevron(dir: "left" | "right") {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {dir === "left" ? (
        <polyline points="15 18 9 12 15 6" />
      ) : (
        <polyline points="9 18 15 12 9 6" />
      )}
    </svg>
  );
}

const PRESETS: { id: MonthRangePresetId; label: string }[] = [
  { id: "thisMonth", label: "This Month" },
  { id: "last3", label: "Last 3 Months" },
  { id: "last6", label: "Last 6 Months" },
  { id: "last12", label: "Last 12 Months" },
  { id: "ytd", label: "Year To Date" },
  { id: "lastYear", label: "Last Year" },
  { id: "all", label: "All Dates" },
];

function triggerLabel(
  current: DateRange,
  bounds: DateRange,
  startKey: MonthKey,
  endKey: MonthKey
): string {
  if (isFullDataRange(current, bounds)) return "All dates";
  if (startKey === endKey) {
    return format(parseMonthKey(startKey), "MMM yyyy");
  }
  return `${format(parseMonthKey(startKey), "MMM yyyy")} – ${format(
    parseMonthKey(endKey),
    "MMM yyyy"
  )}`;
}

type Props = {
  current: DateRange;
  bounds: DateRange;
  onApply: (next: DateRange) => void;
  extraActions?: ReactNode;
};

export function MonthRangePicker({
  current,
  bounds,
  onApply,
  extraActions,
}: Props) {
  const { startKey, endKey } = dateRangeToMonthKeys(current);
  const boundsMinKey = dateRangeToMonthKeys(bounds).startKey;
  const boundsMaxKey = dateRangeToMonthKeys(bounds).endKey;

  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = triggerLabel(current, bounds, startKey, endKey);

  const tryApplyKeys = (a: MonthKey, b: MonthKey) => {
    const lo = a <= b ? a : b;
    const hi = a <= b ? b : a;
    const next = monthKeysToClippedRange(lo, hi, bounds);
    if (next) onApply(next);
  };

  const onPreset = (id: MonthRangePresetId) => {
    const next = applyPreset(id, bounds, new Date());
    if (next) {
      onApply(next);
      setOpen(false);
    }
  };

  const prev = shiftMonthRangeByStep(current, bounds, -1);
  const next = shiftMonthRangeByStep(current, bounds, 1);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.65rem",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex" }}>
        <div className="ynab-range-shell">
          <button
            type="button"
            className="ynab-range-arrow"
            aria-label="Previous month"
            disabled={!prev}
            onClick={() => prev && onApply(prev)}
          >
            {chevron("left")}
          </button>
          <button
            ref={btnRef}
            type="button"
            className="ynab-range-trigger"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Date range"
            onClick={() => setOpen((o) => !o)}
          >
            {calendarIcon()}
            {label}
          </button>
          <button
            type="button"
            className="ynab-range-arrow"
            aria-label="Next month"
            disabled={!next}
            onClick={() => next && onApply(next)}
          >
            {chevron("right")}
          </button>
        </div>

        {open ? (
          <div
            ref={popRef}
            role="dialog"
            aria-label="Month range"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              zIndex: 50,
              minWidth: 280,
              maxWidth: "min(100vw - 2rem, 340px)",
              padding: "4px 0 12px",
              borderRadius: 12,
              border: "1px solid var(--ynab-border)",
              background: "var(--ynab-popover-bg)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -6,
                left: 28,
                width: 10,
                height: 10,
                transform: "rotate(45deg)",
                background: "var(--ynab-popover-bg)",
                borderLeft: "1px solid var(--ynab-border)",
                borderTop: "1px solid var(--ynab-border)",
              }}
            />
            <div style={{ padding: "4px 0" }}>
              {PRESETS.map(({ id, label: pl }) => (
                <button
                  key={id}
                  type="button"
                  className="ynab-menu-item"
                  onClick={() => onPreset(id)}
                >
                  {pl}
                </button>
              ))}
            </div>
            <div
              style={{
                borderTop: "1px solid var(--ynab-border)",
                margin: "6px 0 10px",
              }}
            />
            <div style={{ padding: "0 12px 4px" }}>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--ynab-text-muted)",
                  marginBottom: 10,
                }}
              >
                Custom range (months)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <MonthYearSelect
                  label="Start Date"
                  value={startKey}
                  minKey={boundsMinKey}
                  maxKey={boundsMaxKey}
                  onChange={(k) => tryApplyKeys(k, endKey)}
                />
                <MonthYearSelect
                  label="End Date"
                  value={endKey}
                  minKey={boundsMinKey}
                  maxKey={boundsMaxKey}
                  onChange={(k) => tryApplyKeys(startKey, k)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {extraActions}
    </div>
  );
}
