import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  aggregateMonthlyCashflow,
  filterRegisterForCharts,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { ui } from "@/lib/visualTheme";

function MonthlyScatterChartImpl({
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
    const pts = aggregateMonthlyCashflow(txs);
    const maxNet = Math.max(1, ...pts.map((p) => Math.abs(p.net)));
    const data = pts.map(
      (p) => [p.inflow, p.outflow, p.net] as [number, number, number]
    );

    return {
      title: { show: false },
      tooltip: {
        formatter: (params: { dataIndex: number }) => {
          const p = pts[params.dataIndex];
          if (!p) return "";
          return `${p.label}<br/>Inflow: ${money.format(
            p.inflow
          )}<br/>Outflow: ${money.format(p.outflow)}<br/>Net: ${money.format(
            p.net
          )}`;
        },
      },
      grid: { left: 56, right: 24, top: 28, bottom: 48 },
      xAxis: {
        type: "value",
        name: "Inflow",
        nameTextStyle: { color: ui.axisLabel },
        axisLabel: {
          color: ui.axisLabel,
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: ui.splitLine } },
      },
      yAxis: {
        type: "value",
        name: "Outflow",
        nameTextStyle: { color: ui.axisLabel },
        axisLabel: {
          color: ui.axisLabel,
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: ui.splitLine } },
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
          itemStyle: { color: ui.accent, opacity: 0.85 },
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 400 }} notMerge lazyUpdate />
  );
}

export const MonthlyScatterChart = memo(MonthlyScatterChartImpl);
