import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  buildSpendingTreemap,
  filterRegisterForCharts,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

function SunburstSpendingChartImpl({
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
    const root = buildSpendingTreemap(txs);
    const data = root.children ?? [];
    return {
      title: { show: false },
      tooltip: {
        formatter: (info: { name: string; value: number }) =>
          `${info.name}: ${money.format(info.value)}`,
      },
      series: [
        {
          type: "sunburst",
          data,
          radius: [0, "90%"],
          label: { color: "#fff", fontSize: 10 },
          itemStyle: {
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#0f1419",
          },
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 420 }} notMerge lazyUpdate />
  );
}

export const SunburstSpendingChart = memo(SunburstSpendingChartImpl);
