import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  aggregateMonthlyCashflow,
  filterTransactions,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

export function CashflowChart({
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
    const pts = aggregateMonthlyCashflow(txs);
    const labels = pts.map((p) => p.label);
    return {
      title: {
        text: "Monthly cashflow",
        left: "center",
        textStyle: { color: "#e8eaed" },
      },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        data: ["Inflow", "Outflow", "Net"],
        bottom: 0,
        textStyle: { color: "#b8c0cc" },
      },
      grid: { left: 48, right: 24, top: 48, bottom: 56 },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#9aa5b1", rotate: labels.length > 18 ? 45 : 0 },
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
          name: "Inflow",
          type: "bar",
          data: pts.map((p) => p.inflow),
          itemStyle: { color: "#5d9e6b" },
        },
        {
          name: "Outflow",
          type: "bar",
          data: pts.map((p) => p.outflow),
          itemStyle: { color: "#c75c5c" },
        },
        {
          name: "Net",
          type: "line",
          data: pts.map((p) => p.net),
          itemStyle: { color: "#7cb7ff" },
          smooth: true,
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts
        option={option}
        style={{ height: 360 }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
