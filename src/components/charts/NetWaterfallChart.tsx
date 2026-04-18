import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  aggregateMonthlyCashflow,
  filterTransactions,
  type DateRange,
} from "@/lib/aggregate";
import { waterfallSeriesFromMonthlyNet } from "@/lib/galleryAggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

/** Stacked-bar waterfall: monthly net cashflow building cumulative position. */
export function NetWaterfallChart({
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
    const txs = filterTransactions(transactions, dateRange);
    const monthly = aggregateMonthlyCashflow(txs);
    const { categories, base, nets, cumulativeEnd } =
      waterfallSeriesFromMonthlyNet(monthly);

    return {
      title: {
        text: "Monthly net (waterfall-style)",
        subtext: "Transparent bar = start of month cumulative; colored = this month net; line = end cumulative",
        left: "center",
        textStyle: { color: "#e8eaed" },
        subtextStyle: { color: "#9aa5b1", fontSize: 11 },
      },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        data: ["Start position", "Net this month", "Cumulative (line)"],
        bottom: 0,
        textStyle: { color: "#b8c0cc" },
      },
      grid: { left: 48, right: 24, top: 72, bottom: 72 },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: { color: "#9aa5b1", rotate: categories.length > 14 ? 45 : 0 },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#9aa5b1",
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      series: [
        {
          name: "Start position",
          type: "bar",
          stack: "wf",
          itemStyle: { color: "transparent" },
          emphasis: { disabled: true },
          data: base,
        },
        {
          name: "Net this month",
          type: "bar",
          stack: "wf",
          data: nets,
          itemStyle: { color: "#7cb7ff" },
        },
        {
          name: "Cumulative (line)",
          type: "line",
          data: cumulativeEnd,
          symbol: "circle",
          itemStyle: { color: "#7cb7ff" },
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts option={option} style={{ height: 380 }} notMerge lazyUpdate />
    </div>
  );
}
