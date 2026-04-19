import { useAppStore } from "@/store/appStore";
import type { ChartId } from "@/lib/chartIds";
import type { DateRange } from "@/lib/aggregate";
import { MonthRangePicker } from "@/components/filters/MonthRangePicker";
import { defaultDateRangeForChart } from "@/lib/chartDateDefaults";
import { defaultFullRangeThroughLastCompleteMonth } from "@/lib/defaultMonthRange";

type Props = { chartId: ChartId } | { scope: "transactions" };

export function DateRangeFilter(props: Props) {
  const transactions = useAppStore((s) => s.transactions);
  const chartDateRanges = useAppStore((s) => s.chartDateRanges);
  const transactionsDateRange = useAppStore((s) => s.transactionsDateRange);
  const setChartDateRange = useAppStore((s) => s.setChartDateRange);
  const setTransactionsDateRange = useAppStore(
    (s) => s.setTransactionsDateRange
  );

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

  const current: DateRange = (() => {
    if ("scope" in props && props.scope === "transactions") {
      return (
        transactionsDateRange ??
        defaultFullRangeThroughLastCompleteMonth(transactions)!
      );
    }
    if ("chartId" in props) {
      const { chartId } = props;
      const stored = chartDateRanges[chartId];
      if (stored) return stored;
      return defaultDateRangeForChart(chartId, transactions)!;
    }
    throw new Error("DateRangeFilter: expected chartId or transactions scope");
  })();

  const apply = (next: DateRange) => {
    if ("scope" in props && props.scope === "transactions") {
      setTransactionsDateRange(next);
    } else if ("chartId" in props) {
      setChartDateRange(props.chartId, next);
    }
  };

  const resetToDefault = () => {
    if ("scope" in props && props.scope === "transactions") {
      setTransactionsDateRange(null);
    } else if ("chartId" in props) {
      setChartDateRange(props.chartId, null);
    }
  };

  return (
    <MonthRangePicker
      current={current}
      bounds={bounds}
      onApply={apply}
      extraActions={
        <button
          type="button"
          className="ynab-btn ynab-btn--ghost"
          onClick={resetToDefault}
        >
          Reset to default
        </button>
      }
    />
  );
}
