import { memo, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import {
  aggregatePlanActivityByCategoryInGroup,
  filterPlanRowsByDateRange,
  type DateRange,
} from "@/lib/aggregate";
import { buildPlanActivityStackChartOption } from "@/lib/planActivityStackChart";
import { getCurrencyFormatter } from "@/lib/money";
import type { PlanRow } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

function PlanActivityDrilldownChartImpl({
  planRows,
  dateRange,
  categoryGroup,
}: {
  planRows: PlanRow[];
  dateRange: DateRange | null;
  categoryGroup: string;
}) {
  const setSelection = useAppStore((s) => s.setSelection);
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "chart"),
    [displayCurrency]
  );

  const chartRef = useRef<EChartsInstance | null>(null);
  const [hoveredSeriesName, setHoveredSeriesName] = useState<string | null>(
    null
  );

  const option = useMemo(() => {
    const filtered = filterPlanRowsByDateRange(planRows, dateRange);
    const pts = aggregatePlanActivityByCategoryInGroup(
      filtered,
      categoryGroup
    );
    const catSet = new Set<string>();
    for (const p of pts) {
      for (const c of Object.keys(p.byGroup)) catSet.add(c);
    }
    const categories = [...catSet].sort((a, b) => a.localeCompare(b));
    if (categories.length === 0) {
      return null;
    }
    return buildPlanActivityStackChartOption({
      pts,
      stackKeys: categories,
      money,
      hoveredSeriesName,
    });
  }, [planRows, dateRange, money, categoryGroup, hoveredSeriesName]);

  const onEvents = useMemo(
    () => ({
      mouseover: (params: {
        componentType: string;
        seriesName?: string;
      }) => {
        if (params.componentType !== "series" || !params.seriesName) return;
        setHoveredSeriesName(params.seriesName);
        const ec = chartRef.current;
        if (!ec) return;
        ec.dispatchAction({ type: "downplay" });
        ec.dispatchAction({
          type: "highlight",
          seriesName: params.seriesName,
        });
      },
      globalout: () => {
        setHoveredSeriesName(null);
        chartRef.current?.dispatchAction({ type: "downplay" });
      },
      click: (params: { componentType: string; seriesName?: string }) => {
        if (params.componentType !== "series" || !params.seriesName) return;
        setSelection({
          categoryGroup,
          category: params.seriesName,
        });
      },
    }),
    [setSelection, categoryGroup]
  );

  if (!option) return null;

  return (
    <>
      <ReactECharts
        option={option}
        style={{ height: 400 }}
        notMerge
        lazyUpdate
        onChartReady={(ec) => {
          chartRef.current = ec;
        }}
        onEvents={onEvents}
      />
      <p
        style={{
          color: "var(--ynab-text-dim)",
          fontSize: "0.85rem",
          marginTop: 8,
        }}
      >
        Plan activity for &quot;{categoryGroup}&quot; split by category. Click a
        segment to narrow the register table to that category.
      </p>
    </>
  );
}

export const PlanActivityDrilldownChart = memo(PlanActivityDrilldownChartImpl);
