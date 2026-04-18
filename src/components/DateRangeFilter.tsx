import { format } from "date-fns";
import { useAppStore } from "@/store/appStore";
import type { DateRange } from "@/lib/aggregate";
import type { ChartId } from "@/lib/chartIds";

function toInput(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseInput(s: string): Date | null {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

type Props = {
  /** When set, edits only this chart’s range (global range is the default). */
  chartId?: ChartId;
};

export function DateRangeFilter({ chartId }: Props) {
  const transactions = useAppStore((s) => s.transactions);
  const globalRange = useAppStore((s) => s.dateRange);
  const override = useAppStore((s) =>
    chartId ? s.chartDateOverrides[chartId] : undefined
  );
  const setDateRange = useAppStore((s) => s.setDateRange);
  const setChartDateRange = useAppStore((s) => s.setChartDateRange);

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

  const effectiveGlobal = globalRange ?? bounds;
  const current = chartId ? override ?? effectiveGlobal : effectiveGlobal;

  const apply = (next: DateRange) => {
    if (chartId) {
      setChartDateRange(chartId, next);
    } else {
      setDateRange(next);
    }
  };

  const update = (partial: Partial<DateRange>) => {
    const next: DateRange = {
      start: partial.start ?? current.start,
      end: partial.end ?? current.end,
    };
    if (next.start > next.end) return;
    apply(next);
  };

  const isPerChart = Boolean(chartId);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        alignItems: "center",
      }}
    >
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
        onClick={() => apply(bounds)}
        style={{
          padding: "0.35rem 0.75rem",
          background: "#2a3544",
          border: "1px solid #3d4d60",
          borderRadius: 6,
          color: "#e8eaed",
          fontSize: "0.85rem",
        }}
      >
        Full range
      </button>
      {isPerChart ? (
        <button
          type="button"
          onClick={() => chartId && setChartDateRange(chartId, null)}
          style={{
            padding: "0.35rem 0.75rem",
            background: "transparent",
            border: "1px solid #3d4d60",
            borderRadius: 6,
            color: "#b8c0cc",
            fontSize: "0.85rem",
          }}
        >
          Use global range
        </button>
      ) : null}
    </div>
  );
}
