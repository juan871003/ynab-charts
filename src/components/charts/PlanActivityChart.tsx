import { memo, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
import {
  aggregatePlanActivityByGroup,
  filterPlanRowsByDateRange,
  type DateRange,
} from "@/lib/aggregate";
import { buildPlanActivityStackChartOption } from "@/lib/planActivityStackChart";
import { getCurrencyFormatter } from "@/lib/money";
import type { PlanRow } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

function PlanActivityChartImpl({
  planRows,
  dateRange,
}: {
  planRows: PlanRow[];
  dateRange: DateRange | null;
}) {
  const openPlanActivityDrill = useAppStore((s) => s.openPlanActivityDrill);
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
    const pts = aggregatePlanActivityByGroup(filtered);
    const groupSet = new Set<string>();
    for (const p of pts) {
      for (const g of Object.keys(p.byGroup)) groupSet.add(g);
    }
    const groups = [...groupSet].sort((a, b) => a.localeCompare(b));
    return buildPlanActivityStackChartOption({
      pts,
      stackKeys: groups,
      money,
      hoveredSeriesName,
    });
  }, [planRows, dateRange, money, hoveredSeriesName]);

  const onEvents = useMemo(
    () => ({
      mouseover: (params: { componentType: string; seriesName?: string }) => {
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
        openPlanActivityDrill(params.seriesName);
      },
    }),
    [openPlanActivityDrill]
  );

  if (planRows.length === 0 || !option) return null;

  return (
    <>
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
      <p
        style={{
          color: "var(--ynab-text-dim)",
          fontSize: "0.85rem",
          marginTop: 8,
        }}
      >
        Hover a color to focus that category group (legend matches). Click a
        stack segment to open subcategories for that group (replaces this chart)
        and filter the register table to that group.
      </p>
    </>
  );
}

export const PlanActivityChart = memo(PlanActivityChartImpl);
