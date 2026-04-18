import { useMemo } from "react";
import {
  getTransactionDateBounds,
  monthKeyBoundsForTreemap,
  resolveTreemapMonthKey,
} from "@/lib/aggregate";
import { useAppStore } from "@/store/appStore";
import { DateRangeFilter } from "@/components/DateRangeFilter";

const btnStyle = {
  padding: "0.35rem 0.75rem",
  background: "#2a3544",
  border: "1px solid #3d4d60",
  borderRadius: 6,
  color: "#e8eaed",
  fontSize: "0.85rem",
  cursor: "pointer" as const,
};

const btnGhostStyle = {
  ...btnStyle,
  background: "transparent",
  color: "#b8c0cc",
};

export function TreemapDateControls() {
  const transactions = useAppStore((s) => s.transactions);
  const globalRange = useAppStore((s) => s.dateRange);
  const mode = useAppStore((s) => s.treemapViewMode);
  const treemapMonthKey = useAppStore((s) => s.treemapMonthKey);
  const setTreemapViewMode = useAppStore((s) => s.setTreemapViewMode);
  const setTreemapMonthKey = useAppStore((s) => s.setTreemapMonthKey);

  const clip = useMemo(() => {
    const bounds = getTransactionDateBounds(transactions);
    if (!bounds) return null;
    return globalRange ?? bounds;
  }, [transactions, globalRange]);

  const monthBounds = useMemo(() => {
    if (!clip)
      return { min: null as string | null, max: null as string | null };
    return monthKeyBoundsForTreemap(transactions, clip);
  }, [transactions, clip]);

  const resolvedMonth = useMemo(() => {
    if (!clip) return null;
    return resolveTreemapMonthKey(transactions, clip, treemapMonthKey);
  }, [transactions, clip, treemapMonthKey]);

  if (transactions.length === 0 || !clip) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.65rem",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", color: "#9aa5b1", marginRight: 4 }}>
          View by
        </span>
        <button
          type="button"
          onClick={() => setTreemapViewMode("month")}
          style={{
            ...btnStyle,
            opacity: mode === "month" ? 1 : 0.65,
            borderColor: mode === "month" ? "#5a7a9a" : "#3d4d60",
          }}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setTreemapViewMode("range")}
          style={{
            ...btnStyle,
            opacity: mode === "range" ? 1 : 0.65,
            borderColor: mode === "range" ? "#5a7a9a" : "#3d4d60",
          }}
        >
          Date range
        </button>
      </div>

      {mode === "month" ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.85rem" }}>Month</span>
            <input
              type="month"
              min={monthBounds.min ?? undefined}
              max={monthBounds.max ?? undefined}
              value={resolvedMonth ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setTreemapMonthKey(v);
              }}
              disabled={!resolvedMonth}
            />
          </label>
          <button
            type="button"
            onClick={() => setTreemapMonthKey(null)}
            style={btnGhostStyle}
            disabled={treemapMonthKey === null}
            title="Show the latest month that has data within the global range"
          >
            Latest in range
          </button>
          <span style={{ fontSize: "0.8rem", color: "#7a8794" }}>
            One calendar month, clipped to the global date range. With no
            explicit month, the latest month in that range is used.
          </span>
        </div>
      ) : (
        <DateRangeFilter chartId="treemap" />
      )}
    </div>
  );
}
