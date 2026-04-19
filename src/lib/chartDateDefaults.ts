import type { DateRange } from "@/lib/aggregate";
import type { ChartId } from "@/lib/chartIds";
import { CHART_IDS } from "@/lib/chartIds";
import type { NormalizedTransaction } from "@/lib/types";
import {
  defaultFullRangeThroughLastCompleteMonth,
  defaultSingleMonthRange,
} from "@/lib/defaultMonthRange";

/** Treemap, Sankey, Pareto, accounts, radar, sunburst, inflow Sankey — one full month. */
export const CHART_IDS_SINGLE_MONTH_DEFAULT: readonly ChartId[] = [
  "treemap",
  "sankey",
  "topPayees",
  "accountDonut",
  "radarCompare",
  "sunburstSpending",
  "inflowSankey",
];

/** Cashflow, plan, calendar, weekday, stacked area, scatter, waterfall — span of dates. */
export const CHART_IDS_FULL_RANGE_DEFAULT: readonly ChartId[] = [
  "cashflow",
  "planActivity",
  "calendarHeatmap",
  "dayOfWeek",
  "registerStackedArea",
  "monthlyScatter",
  "netWaterfall",
];

const singleSet = new Set(CHART_IDS_SINGLE_MONTH_DEFAULT);
const fullSet = new Set(CHART_IDS_FULL_RANGE_DEFAULT);

for (const id of CHART_IDS) {
  const inSingle = singleSet.has(id);
  const inFull = fullSet.has(id);
  if (inSingle === inFull) {
    throw new Error(
      `chartDateDefaults: "${id}" must be in exactly one default group`
    );
  }
}

export function defaultDateRangeForChart(
  chartId: ChartId,
  txs: NormalizedTransaction[],
  today: Date = new Date()
): DateRange | null {
  return singleSet.has(chartId)
    ? defaultSingleMonthRange(txs, today)
    : defaultFullRangeThroughLastCompleteMonth(txs, today);
}

export function buildChartDateRanges(
  txs: NormalizedTransaction[],
  today: Date = new Date()
): Record<ChartId, DateRange> {
  const single = defaultSingleMonthRange(txs, today);
  const full = defaultFullRangeThroughLastCompleteMonth(txs, today);
  if (!single || !full) {
    throw new Error("buildChartDateRanges: need at least one transaction");
  }
  const out = {} as Record<ChartId, DateRange>;
  for (const id of CHART_IDS_SINGLE_MONTH_DEFAULT) {
    out[id] = single;
  }
  for (const id of CHART_IDS_FULL_RANGE_DEFAULT) {
    out[id] = full;
  }
  return out;
}
