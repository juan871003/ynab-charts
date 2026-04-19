import type { PlanStackPoint } from "@/lib/aggregate";
import { chartPalette, ui } from "@/lib/visualTheme";

/** Internal series used only for month total labels (hidden from legend & tooltip). */
export const PLAN_STACK_TOTAL_SERIES = "__plan_stack_total";

export function monthTotalsForPlanStack(
  pts: PlanStackPoint[],
  stackKeys: string[]
): number[] {
  return pts.map((p) =>
    stackKeys.reduce((sum, k) => sum + (p.byGroup[k] ?? 0), 0)
  );
}

function axisTooltipHtml(
  params: unknown,
  valueLabel: (v: number) => string
): string {
  const arr = (Array.isArray(params) ? params : [params]) as Array<{
    axisValue?: string;
    axisValueLabel?: string;
    seriesName?: string;
    value?: number | number[];
    marker?: string;
    data?: unknown;
  }>;
  const rows = arr.filter((p) => p.seriesName !== PLAN_STACK_TOTAL_SERIES);
  if (rows.length === 0) return "";
  const head =
    rows[0].axisValueLabel ?? rows[0].axisValue ?? "";
  const lines = rows.map((p) => {
    const v = Array.isArray(p.value) ? p.value[0] : p.value;
    const n = typeof v === "number" ? v : Number(v);
    return `${p.marker ?? ""}${p.seriesName}: ${valueLabel(n)}`;
  });
  return `${head}<br/>${lines.join("<br/>")}`;
}

/**
 * Stacked plan bars + transparent overlay for month totals + legend emphasis when
 * `hoveredSeriesName` matches (synced from chart mouseover).
 */
export function buildPlanActivityStackChartOption(opts: {
  pts: PlanStackPoint[];
  stackKeys: string[];
  money: Intl.NumberFormat;
  hoveredSeriesName: string | null;
}): Record<string, unknown> | null {
  const { pts, stackKeys, money, hoveredSeriesName } = opts;
  if (pts.length === 0 || stackKeys.length === 0) {
    return null;
  }
  const labels = pts.map((p) => p.label);
  const monthTotals = monthTotalsForPlanStack(pts, stackKeys);

  const stackSeries = stackKeys.map((g, i) => ({
    name: g,
    type: "bar" as const,
    stack: "act",
    legendHoverLink: true,
    cursor: "pointer" as const,
    emphasis: {
      focus: "series" as const,
      blurScope: "coordinateSystem" as const,
      itemStyle: {
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.55)",
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.55)",
      },
    },
    blur: {
      itemStyle: {
        opacity: 0.14,
      },
    },
    data: pts.map((p) => p.byGroup[g] ?? 0),
    itemStyle: { color: chartPalette[i % chartPalette.length] },
  }));

  const totalSeries = {
    name: PLAN_STACK_TOTAL_SERIES,
    type: "bar" as const,
    barGap: "-100%",
    data: monthTotals,
    itemStyle: { color: "transparent" },
    label: {
      show: true,
      position: "top" as const,
      formatter: (p: { value?: number }) => money.format(Number(p.value)),
      color: ui.textPrimary,
      fontSize: 11,
    },
    emphasis: { disabled: true },
    silent: true,
    legendHoverLink: false,
    tooltip: { show: false },
    showInLegend: false,
    z: 100,
  };

  const valueLabel = (v: number) => money.format(v);

  return {
    title: { show: false },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
        triggerEmphasis: false,
      },
      valueFormatter: (v: number) => valueLabel(v),
      formatter: (params: unknown) => axisTooltipHtml(params, valueLabel),
    },
    legend: {
      type: "scroll",
      bottom: 0,
      data: stackKeys.map((name) => ({
        name,
        textStyle: {
          color: ui.title,
          fontWeight:
            hoveredSeriesName === name ? ("bold" as const) : ("normal" as const),
        },
      })),
    },
    grid: { left: 48, right: 24, top: 40, bottom: 120 },
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
        formatter: (v: number | string) =>
          valueLabel(typeof v === "number" ? v : Number(v)),
      },
      splitLine: { lineStyle: { color: ui.splitLine } },
    },
    series: [...stackSeries, totalSeries],
  };
}
