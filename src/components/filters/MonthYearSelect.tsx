import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { format } from "date-fns";
import { parseMonthKey, toMonthKey, type MonthKey } from "@/lib/monthRange";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type Props = {
  label: string;
  value: MonthKey;
  minKey: MonthKey;
  maxKey: MonthKey;
  onChange: (key: MonthKey) => void;
};

export function MonthYearSelect({
  label,
  value,
  minKey,
  maxKey,
  onChange,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => parseMonthKey(value).getFullYear());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setYear(parseMonthKey(value).getFullYear());
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
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

  const labelText = format(parseMonthKey(value), "MMM yyyy");

  const monthKeyFor = (monthIndex0: number): MonthKey => {
    return toMonthKey(new Date(year, monthIndex0, 1));
  };

  const canPick = (mk: MonthKey) => mk >= minKey && mk <= maxKey;

  const canPrevYear = `${year - 1}-12` >= minKey;
  const canNextYear = `${year + 1}-01` <= maxKey;

  return (
    <div ref={wrapRef} style={{ position: "relative", minWidth: 140 }}>
      <label
        id={`${id}-l`}
        style={{
          display: "block",
          fontSize: "0.75rem",
          color: "var(--ynab-text-muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <button
        type="button"
        aria-labelledby={`${id}-l`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          minHeight: "var(--ynab-control-h)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "0 10px",
          borderRadius: "var(--ynab-radius)",
          border: "1px solid var(--ynab-border-strong)",
          background: "var(--ynab-pill-bg)",
          color: "var(--ynab-text)",
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
      >
        <span>{labelText}</span>
        <span style={{ color: "var(--ynab-text-muted)", fontSize: "0.7rem" }}>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`${label} month picker`}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 60,
            minWidth: 260,
            padding: "10px 10px 12px",
            borderRadius: 10,
            border: "1px solid var(--ynab-border)",
            background: "var(--ynab-popover-bg)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <button
              type="button"
              aria-label="Previous year"
              disabled={!canPrevYear}
              onClick={() => setYear((y) => y - 1)}
              style={yearNavBtn(!canPrevYear)}
            >
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{year}</span>
            <button
              type="button"
              aria-label="Next year"
              disabled={!canNextYear}
              onClick={() => setYear((y) => y + 1)}
              style={yearNavBtn(!canNextYear)}
            >
              ›
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
            }}
          >
            {MONTHS.map((m, i) => {
              const mk = monthKeyFor(i);
              const ok = canPick(mk);
              const sel = mk === value;
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!ok}
                  onClick={() => {
                    onChange(mk);
                    setOpen(false);
                  }}
                  style={{
                    padding: "0.4rem 0",
                    borderRadius: 6,
                    border: "none",
                    background: sel
                      ? "var(--ynab-accent)"
                      : ok
                      ? "transparent"
                      : "transparent",
                    color: !ok
                      ? "var(--ynab-text-dim)"
                      : sel
                      ? "var(--ynab-on-primary)"
                      : "var(--ynab-text)",
                    fontSize: "0.8rem",
                    cursor: ok ? "pointer" : "not-allowed",
                    opacity: ok ? 1 : 0.35,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function yearNavBtn(disabled: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 999,
    border: "1px solid var(--ynab-border)",
    background: "transparent",
    color: "var(--ynab-text-muted)",
    fontSize: "1rem",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1,
  };
}
