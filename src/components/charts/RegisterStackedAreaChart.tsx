import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { filterRegisterForCharts, type DateRange } from "@/lib/aggregate";
import { aggregateRegisterOutflowByGroupMonthly } from "@/lib/galleryAggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { chartPalette, ui } from "@/lib/visualTheme";

function RegisterStackedAreaChartImpl({
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
    const pts = aggregateRegisterOutflowByGroupMonthly(txs);
    const labels = pts.map((p) => p.label);
    const groupSet = new Set<string>();
    for (const p of pts) {
      for (const g of Object.keys(p.byGroup)) groupSet.add(g);
    }
    const groups = [...groupSet].sort((a, b) => a.localeCompare(b));

    const series = groups.map((g, i) => ({
      name: g,
      type: "line" as const,
      stack: "reg",
      areaStyle: {},
      emphasis: { focus: "series" as const },
      data: pts.map((p) => p.byGroup[g] ?? 0),
      itemStyle: { color: chartPalette[i % chartPalette.length] },
    }));

    return {
      title: { show: false },
      tooltip: {
        trigger: "axis",
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        type: "scroll",
        bottom: 0,
        textStyle: { color: ui.title },
      },
      grid: { left: 48, right: 24, top: 28, bottom: 120 },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: {
          color: ui.axisLabel,
          rotate: labels.length > 14 ? 45 : 0,
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
      series,
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 420 }} notMerge lazyUpdate />
  );
}

export const RegisterStackedAreaChart = memo(RegisterStackedAreaChartImpl);
