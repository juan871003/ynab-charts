import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { filterRegisterForCharts, type DateRange } from "@/lib/aggregate";
import { aggregateWeekdayOutflow } from "@/lib/galleryAggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { ui } from "@/lib/visualTheme";

function DayOfWeekChartImpl({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "chart"),
    [displayCurrency]
  );

  const option = useMemo(() => {
    const txs = filterRegisterForCharts(transactions, dateRange);
    const pts = aggregateWeekdayOutflow(txs);
    const labels = pts.map((p) => p.label);
    return {
      title: { show: false },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        data: ["Mean outflow", "Txn count"],
        bottom: 0,
        textStyle: { color: ui.title },
      },
      grid: { left: 48, right: 48, top: 28, bottom: 56 },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: ui.axisLabel },
      },
      yAxis: [
        {
          type: "value",
          name: "Outflow",
          axisLabel: {
            color: ui.axisLabel,
            formatter: (v: number) => money.format(v),
          },
          splitLine: { lineStyle: { color: ui.splitLine } },
        },
        {
          type: "value",
          name: "Count",
          axisLabel: { color: ui.axisLabel },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Mean outflow",
          type: "bar",
          data: pts.map((p) => p.meanOutflow),
          itemStyle: { color: "#9eb4f0" },
        },
        {
          name: "Txn count",
          type: "line",
          yAxisIndex: 1,
          data: pts.map((p) => p.transactionCount),
          itemStyle: { color: "#f2c14e" },
          xAxisIndex: 0,
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 320 }} notMerge lazyUpdate />
  );
}

export const DayOfWeekChart = memo(DayOfWeekChartImpl);
