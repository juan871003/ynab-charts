/** Stable ids for per-chart date ranges and panel wiring. */
export const CHART_IDS = [
  "cashflow",
  "treemap",
  "planActivity",
  "sankey",
  "calendarHeatmap",
  "dayOfWeek",
  "topPayees",
  "accountDonut",
  "registerStackedArea",
  "monthlyScatter",
  "radarCompare",
  "netWaterfall",
  "sunburstSpending",
  "inflowSankey",
] as const;

export type ChartId = (typeof CHART_IDS)[number];
