import { memo, type ComponentType } from "react";
import { useAppStore } from "@/store/appStore";
import { ChartPanel } from "@/components/ChartPanel";
import type { DateRange } from "@/lib/aggregate";
import type { ChartId } from "@/lib/chartIds";
import type { NormalizedTransaction } from "@/lib/types";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { TreemapChart } from "@/components/charts/TreemapChart";
import { PlanActivityChart } from "@/components/charts/PlanActivityChart";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { CalendarHeatmapChart } from "@/components/charts/CalendarHeatmapChart";
import { DayOfWeekChart } from "@/components/charts/DayOfWeekChart";
import { TopPayeesChart } from "@/components/charts/TopPayeesChart";
import { AccountDonutChart } from "@/components/charts/AccountDonutChart";
import { RegisterStackedAreaChart } from "@/components/charts/RegisterStackedAreaChart";
import { MonthlyScatterChart } from "@/components/charts/MonthlyScatterChart";
import { RadarCompareChart } from "@/components/charts/RadarCompareChart";
import { NetWaterfallChart } from "@/components/charts/NetWaterfallChart";
import { SunburstSpendingChart } from "@/components/charts/SunburstSpendingChart";
import { InflowSankeyChart } from "@/components/charts/InflowSankeyChart";
import { defaultDateRangeForChart } from "@/lib/chartDateDefaults";

function GroupHeading({ children }: { children: string }) {
  return (
    <h2
      style={{
        margin: "2.25rem 0 0",
        fontSize: "1.2rem",
        fontWeight: 600,
        color: "var(--ynab-text-muted)",
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </h2>
  );
}

function makeRegisterSection(
  chartId: ChartId,
  title: string,
  description: string | undefined,
  Chart: ComponentType<{
    transactions: NormalizedTransaction[];
    dateRange: DateRange | null;
  }>
) {
  return memo(function RegisterSection() {
    const dateRange = useAppStore((s) => {
      const r = s.chartDateRanges[chartId];
      if (r) return r;
      if (s.transactions.length === 0) return null;
      return defaultDateRangeForChart(chartId, s.transactions);
    });
    const transactions = useAppStore((s) => s.transactions);
    return (
      <ChartPanel title={title} description={description} chartId={chartId}>
        <Chart transactions={transactions} dateRange={dateRange} />
      </ChartPanel>
    );
  });
}

const CashflowSection = makeRegisterSection(
  "cashflow",
  "Monthly cashflow",
  undefined,
  CashflowChart
);
const TreemapSection = makeRegisterSection(
  "treemap",
  "Spending by category (treemap)",
  "Sums outflows in the selected month range.",
  TreemapChart
);
const SankeySection = makeRegisterSection(
  "sankey",
  "Outflows → category groups (Sankey)",
  undefined,
  SankeyChart
);
const CalendarHeatmapSection = makeRegisterSection(
  "calendarHeatmap",
  "Daily outflows (calendar)",
  "Heatmap uses the selected range for both filtering and the calendar span.",
  CalendarHeatmapChart
);
const DayOfWeekSection = makeRegisterSection(
  "dayOfWeek",
  "Outflow by weekday (mean per transaction)",
  undefined,
  DayOfWeekChart
);
const TopPayeesSection = makeRegisterSection(
  "topPayees",
  "Top payees by outflow (Pareto)",
  undefined,
  TopPayeesChart
);
const AccountDonutSection = makeRegisterSection(
  "accountDonut",
  "Outflow by account",
  undefined,
  AccountDonutChart
);
const RegisterStackedAreaSection = makeRegisterSection(
  "registerStackedArea",
  "Register: outflow by category group (stacked area)",
  "From transaction register, not Plan activity.",
  RegisterStackedAreaChart
);
const MonthlyScatterSection = makeRegisterSection(
  "monthlyScatter",
  "Months: inflow vs outflow",
  "Bubble size ~ |net|.",
  MonthlyScatterChart
);
const RadarCompareSection = makeRegisterSection(
  "radarCompare",
  "Category groups: selected range vs trailing 12 months",
  "Indexed average monthly outflow (baseline = 100 from last 12 months in export).",
  RadarCompareChart
);
const NetWaterfallSection = makeRegisterSection(
  "netWaterfall",
  "Monthly net (waterfall-style)",
  "Transparent bar = start of month cumulative; colored = this month net; line = end cumulative.",
  NetWaterfallChart
);
const SunburstSpendingSection = makeRegisterSection(
  "sunburstSpending",
  "Spending hierarchy (sunburst)",
  undefined,
  SunburstSpendingChart
);
const InflowSankeySection = makeRegisterSection(
  "inflowSankey",
  "Inflows → category groups (Sankey)",
  undefined,
  InflowSankeyChart
);

const PlanActivitySection = memo(function PlanActivitySection() {
  const dateRange = useAppStore((s) => {
    const r = s.chartDateRanges.planActivity;
    if (r) return r;
    if (s.transactions.length === 0) return null;
    return defaultDateRangeForChart("planActivity", s.transactions);
  });
  const planRows = useAppStore((s) => s.planRows);
  return (
    <ChartPanel
      title="Plan activity by category group (stacked)"
      description="Sum of spending-side activity per month (max(0, −Activity))."
      chartId="planActivity"
    >
      <PlanActivityChart planRows={planRows} dateRange={dateRange} />
    </ChartPanel>
  );
});

export function OverviewChartBlocks() {
  return (
    <>
      <GroupHeading>Overview</GroupHeading>
      <CashflowSection />
      <TreemapSection />
      <PlanActivitySection />
      <SankeySection />
      <CalendarHeatmapSection />
    </>
  );
}

export function GalleryChartBlocks() {
  return (
    <>
      <GroupHeading>Gallery — more chart types</GroupHeading>
      <DayOfWeekSection />
      <TopPayeesSection />
      <AccountDonutSection />
      <RegisterStackedAreaSection />
      <MonthlyScatterSection />
      <RadarCompareSection />
      <NetWaterfallSection />
      <SunburstSpendingSection />
      <InflowSankeySection />
    </>
  );
}
