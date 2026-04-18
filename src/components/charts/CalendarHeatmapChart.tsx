import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { format, subMonths } from "date-fns";
import {
  aggregateDailyOutflow,
  filterTransactions,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

export function CalendarHeatmapChart({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "table"),
    [displayCurrency]
  );

  const option = useMemo(() => {
    const txs = filterTransactions(transactions, dateRange);
    const daily = aggregateDailyOutflow(txs);
    const data: [string, number][] = [...daily.entries()].map(([d, v]) => [
      d,
      v,
    ]);

    let end = dateRange?.end ?? new Date();
    let start = dateRange?.start ?? subMonths(end, 12);
    if (start > end) [start, end] = [end, start];

    const startStr = format(start, "yyyy-MM-dd");
    const endStr = format(end, "yyyy-MM-dd");
    const range: [string, string] = [startStr, endStr];

    const maxVal = Math.max(1, ...data.map(([, v]) => v));

    return {
      title: {
        text: "Daily outflows (calendar)",
        subtext: `${startStr} — ${endStr}`,
        left: "center",
        textStyle: { color: "#e8eaed" },
        subtextStyle: { color: "#9aa5b1", fontSize: 12 },
      },
      tooltip: {
        formatter: (p: { value: [string, number] }) => {
          const [day, val] = p.value;
          return `${day}<br/>Outflow: ${money.format(val)}`;
        },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        orient: "horizontal",
        left: "center",
        bottom: 8,
        textStyle: { color: "#b8c0cc" },
        inRange: { color: ["#1a3a52", "#3d6fb8", "#e0b645"] },
      },
      calendar: {
        range,
        orient: "horizontal",
        cellSize: [14, 14],
        splitLine: { lineStyle: { color: "#2a3544" } },
        yearLabel: { color: "#9aa5b1" },
        dayLabel: { color: "#9aa5b1", firstDay: 1 },
        monthLabel: { color: "#b8c0cc" },
        itemStyle: { borderWidth: 0.5, borderColor: "#2a3544" },
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data,
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts
        option={option}
        style={{ height: 280 }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
