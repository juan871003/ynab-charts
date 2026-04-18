import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  aggregateMonthlyCashflow,
  filterRegisterForCharts,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import { ui } from "@/lib/visualTheme";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

function CashflowChartImpl({
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
    const labels = pts.map((p) => p.label);
    return {
      title: { show: false },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        data: ["Inflow", "Outflow", "Net"],
        bottom: 0,
        textStyle: { color: ui.title },
      },
      grid: {
        left: 8,
        right: 24,
        top: 28,
        bottom: 56,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          color: ui.axisLabel,
          rotate: labels.length > 18 ? 45 : 0,
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: ui.axisLabel,
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: ui.splitLine } },
      },
      series: [
        {
          name: "Inflow",
          type: "bar",
          data: pts.map((p) => p.inflow),
          itemStyle: { color: "#c8e65c" },
        },
        {
          name: "Outflow",
          type: "bar",
          data: pts.map((p) => p.outflow),
          itemStyle: { color: "#e95858" },
        },
        {
          name: "Net",
          type: "line",
          data: pts.map((p) => p.net),
          itemStyle: { color: ui.accent },
          smooth: true,
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 360 }} notMerge lazyUpdate />
  );
}

export const CashflowChart = memo(CashflowChartImpl);
