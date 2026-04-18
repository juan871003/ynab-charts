import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { aggregatePlanActivityByGroup } from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { PlanRow } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

export function PlanActivityChart({ planRows }: { planRows: PlanRow[] }) {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "chart"),
    [displayCurrency]
  );

  const option = useMemo(() => {
    const pts = aggregatePlanActivityByGroup(planRows);
    const labels = pts.map((p) => p.label);
    const groupSet = new Set<string>();
    for (const p of pts) {
      for (const g of Object.keys(p.byGroup)) groupSet.add(g);
    }
    const groups = [...groupSet].sort((a, b) => a.localeCompare(b));

    const palette = [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
      "#3ba272",
      "#fc8452",
      "#9a60b4",
      "#ea7ccc",
    ];

    const series = groups.map((g, i) => ({
      name: g,
      type: "bar" as const,
      stack: "act",
      emphasis: { focus: "series" as const },
      data: pts.map((p) => p.byGroup[g] ?? 0),
      itemStyle: { color: palette[i % palette.length] },
    }));

    return {
      title: {
        text: "Plan activity by category group (stacked)",
        subtext: "Sum of spending-side activity per month (max(0, −Activity))",
        left: "center",
        textStyle: { color: "#e8eaed" },
        subtextStyle: { color: "#9aa5b1", fontSize: 12 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        type: "scroll",
        bottom: 0,
        textStyle: { color: "#b8c0cc" },
      },
      grid: { left: 48, right: 24, top: 72, bottom: 120 },
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { color: "#9aa5b1", rotate: labels.length > 14 ? 45 : 0 },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#9aa5b1",
          formatter: (v: number) => money.format(v),
        },
        splitLine: { lineStyle: { color: "#2a3544" } },
      },
      series,
    };
  }, [planRows, money]);

  if (planRows.length === 0) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts
        option={option}
        style={{ height: 420 }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
