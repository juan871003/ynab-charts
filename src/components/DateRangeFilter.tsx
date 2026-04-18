import { useAppStore } from "@/store/appStore";
import type { ChartId } from "@/lib/chartIds";
import type { DateRange } from "@/lib/aggregate";
import { MonthRangePicker } from "@/components/filters/MonthRangePicker";

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
  const current: DateRange = chartId
    ? override ?? effectiveGlobal
    : effectiveGlobal;

  const apply = (next: DateRange) => {
    if (chartId) {
      setChartDateRange(chartId, next);
    } else {
      setDateRange(next);
    }
  };

  const isPerChart = Boolean(chartId);

  return (
    <MonthRangePicker
      current={current}
      bounds={bounds}
      onApply={apply}
      extraActions={
        isPerChart ? (
          <button
            type="button"
            className="ynab-btn ynab-btn--ghost"
            onClick={() => chartId && setChartDateRange(chartId, null)}
          >
            Use global range
          </button>
        ) : null
      }
    />
  );
}
