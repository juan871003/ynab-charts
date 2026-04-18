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

export function MonthlyScatterChart({
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
    const maxNet = Math.max(
      1,
      ...pts.map((p) => Math.abs(p.net))
    );
    const data = pts.map((p) => [p.inflow, p.outflow, p.net] as [number, number, number]);

    return {
      title: {
        text: "Months: inflow vs outflow",
        subtext: "Bubble size ~ |net|",
        left: "center",
        textStyle: { color: "#e8eaed" },
        subtextStyle: { color: "#9aa5b1", fontSize: 12 },
      },
      tooltip: {
        formatter: (params: { dataIndex: number }) => {
          const p = pts[params.dataIndex];
          if (!p) return "";
          return `${p.label}<br/>Inflow: ${money.format(p.inflow)}<br/>Outflow: ${money.format(p.outflow)}<br/>Net: ${money.format(p.net)}`;
        },
      },
      grid: { left: 56, right: 24, top: 72, bottom: 48 },
      xAxis: {
        type: "value",
        name: "Inflow",
        nameTextStyle: { color: "#9aa5b1" },
        axisLabel: {
          color: "#9aa5b1",
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      yAxis: {
        type: "value",
        name: "Outflow",
        nameTextStyle: { color: "#9aa5b1" },
        axisLabel: {
          color: "#9aa5b1",
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      series: [
        {
          type: "scatter",
          data,
          symbolSize: (val: unknown) => {
            const arr = val as number[];
            const net = Math.abs(arr[2] ?? 0);
            return 8 + (net / maxNet) * 28;
          },
          itemStyle: { color: "#7cb7ff", opacity: 0.85 },
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts option={option} style={{ height: 400 }} notMerge lazyUpdate />
    </div>
  );
}
