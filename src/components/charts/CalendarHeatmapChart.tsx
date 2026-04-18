import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { format, subMonths } from "date-fns";
import {
  aggregateDailyOutflow,
  filterRegisterForCharts,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { ui } from "@/lib/visualTheme";

function CalendarHeatmapChartImpl({
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
    const txs = filterRegisterForCharts(transactions, dateRange);
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
        text: "",
        subtext: `${startStr} — ${endStr}`,
        left: "center",
        textStyle: { color: ui.textPrimary },
        subtextStyle: { color: ui.axisLabel, fontSize: 12 },
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
        textStyle: { color: ui.title },
        inRange: { color: ["#252538", "#4a5af8", "#f2c14e"] },
      },
      calendar: {
        range,
        orient: "horizontal",
        cellSize: [14, 14],
        splitLine: { lineStyle: { color: ui.splitLine } },
        yearLabel: { color: ui.axisLabel },
        dayLabel: { color: ui.axisLabel, firstDay: 1 },
        monthLabel: { color: ui.title },
        itemStyle: { borderWidth: 0.5, borderColor: ui.splitLine },
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
    <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
  );
}

export const CalendarHeatmapChart = memo(CalendarHeatmapChartImpl);
