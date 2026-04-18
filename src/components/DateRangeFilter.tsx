import { format } from "date-fns";
import { useAppStore } from "@/store/appStore";
import type { DateRange } from "@/lib/aggregate";

function toInput(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseInput(s: string): Date | null {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function DateRangeFilter() {
  const transactions = useAppStore((s) => s.transactions);
  const dateRange = useAppStore((s) => s.dateRange);
  const setDateRange = useAppStore((s) => s.setDateRange);

  if (transactions.length === 0) return null;

  const bounds = (() => {
    let min = transactions[0].date.getTime();
    let max = transactions[0].date.getTime();
    for (const t of transactions) {
      const x = t.date.getTime();
      if (x < min) min = x;
      if (x > max) max = x;
    }
    return { start: new Date(min), end: new Date(max) };
  })();

  const current = dateRange ?? bounds;

  const update = (partial: Partial<DateRange>) => {
    const next: DateRange = {
      start: partial.start ?? current.start,
      end: partial.end ?? current.end,
    };
    if (next.start > next.end) return;
    setDateRange(next);
  };

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <span style={{ color: "#9aa5b1", fontSize: "0.9rem" }}>Date range</span>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.85rem" }}>From</span>
        <input
          type="date"
          min={toInput(bounds.start)}
          max={toInput(bounds.end)}
          value={toInput(current.start)}
          onChange={(e) => {
            const d = parseInput(e.target.value);
            if (d) update({ start: d });
          }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: "0.85rem" }}>To</span>
        <input
          type="date"
          min={toInput(bounds.start)}
          max={toInput(bounds.end)}
          value={toInput(current.end)}
          onChange={(e) => {
            const d = parseInput(e.target.value);
            if (d) update({ end: d });
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => setDateRange(bounds)}
        style={{
          padding: "0.35rem 0.75rem",
          background: "#2a3544",
          border: "1px solid #3d4d60",
          borderRadius: 6,
          color: "#e8eaed",
        }}
      >
        Full range
      </button>
    </div>
  );
}
