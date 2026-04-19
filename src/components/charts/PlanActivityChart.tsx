import { memo, useMemo, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import {
  aggregatePlanActivityByGroup,
  filterPlanRowsByDateRange,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { PlanRow } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { chartPalette, ui } from "@/lib/visualTheme";

function PlanActivityChartImpl({
  planRows,
  dateRange,
}: {
  planRows: PlanRow[];
  dateRange: DateRange | null;
}) {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "chart"),
    [displayCurrency]
  );

  const chartRef = useRef<EChartsInstance | null>(null);

  const option = useMemo(() => {
    const filtered = filterPlanRowsByDateRange(planRows, dateRange);
    const pts = aggregatePlanActivityByGroup(filtered);
    const labels = pts.map((p) => p.label);
    const groupSet = new Set<string>();
    for (const p of pts) {
      for (const g of Object.keys(p.byGroup)) groupSet.add(g);
    }
    const groups = [...groupSet].sort((a, b) => a.localeCompare(b));

    const series = groups.map((g, i) => ({
      name: g,
      type: "bar" as const,
      stack: "act",
      data: pts.map((p) => p.byGroup[g] ?? 0),
      itemStyle: { color: chartPalette[i % chartPalette.length] },
    }));

    return {
      title: { show: false },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
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
  }, [planRows, dateRange, money]);

  const onEvents = useMemo(
    () => ({
      mouseover: (params: {
        componentType: string;
        seriesName?: string;
      }) => {
        if (params.componentType !== "series" || !params.seriesName) return;
        const ec = chartRef.current;
        if (!ec) return;
        ec.dispatchAction({ type: "downplay" });
        ec.dispatchAction({
          type: "highlight",
          seriesName: params.seriesName,
          notBlur: true,
        });
      },
      globalout: () => {
        chartRef.current?.dispatchAction({ type: "downplay" });
      },
    }),
    []
  );

  if (planRows.length === 0) return null;

  return (
    <ReactECharts
      option={option}
      style={{ height: 420 }}
      notMerge
      lazyUpdate
      onChartReady={(ec) => {
        chartRef.current = ec;
      }}
      onEvents={onEvents}
    />
  );
}

export const PlanActivityChart = memo(PlanActivityChartImpl);
