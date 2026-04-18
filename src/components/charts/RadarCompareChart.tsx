import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  excludeUncategorizedAccountTransfers,
  filterRegisterForCharts,
  type DateRange,
} from "@/lib/aggregate";
import {
  filterTransactionsTrailingMonths,
  radarGroupOutflowIndexed,
} from "@/lib/galleryAggregate";
import type { NormalizedTransaction } from "@/lib/types";

/**
 * Compares **selected date range** vs **trailing 12 calendar months** of the register
 * (average monthly outflow by category group, indexed so baseline = 100).
 */
function RadarCompareChartImpl({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const option = useMemo(() => {
    const baselineTxs = excludeUncategorizedAccountTransfers(
      filterTransactionsTrailingMonths(transactions, 12)
    );
    const currentTxs = filterRegisterForCharts(transactions, dateRange);
    const { groups, baseline, current } = radarGroupOutflowIndexed(
      baselineTxs,
      currentTxs,
      12
    );
    const maxVal = Math.max(100, ...baseline, ...current, 1);
    const roundedMax = Math.ceil(maxVal / 10) * 10;

    return {
      title: { show: false },
      tooltip: {},
      legend: {
        data: ["Baseline (100)", "Current (indexed)"],
        bottom: 0,
        textStyle: { color: "#b8c0cc" },
      },
      radar: {
        indicator: groups.map((name) => ({
          name,
          max: roundedMax,
        })),
        splitLine: { lineStyle: { color: "#2a3544" } },
        splitArea: { show: false },
        axisName: { color: "#9aa5b1", fontSize: 10 },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: baseline,
              name: "Baseline (100)",
              areaStyle: { opacity: 0.05 },
            },
            {
              value: current,
              name: "Current (indexed)",
              areaStyle: { opacity: 0.15 },
            },
          ],
        },
      ],
    };
  }, [transactions, dateRange]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 440 }} notMerge lazyUpdate />
  );
}

export const RadarCompareChart = memo(RadarCompareChartImpl);
