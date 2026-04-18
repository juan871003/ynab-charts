import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { filterRegisterForCharts, type DateRange } from "@/lib/aggregate";
import { topNByOutflow } from "@/lib/galleryAggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

function AccountDonutChartImpl({
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
    const parts = topNByOutflow(txs, (t) => t.account, 10);
    return {
      title: { show: false },
      tooltip: {
        trigger: "item",
        valueFormatter: (v: number) => money.format(v),
      },
      legend: {
        orient: "vertical",
        left: "left",
        top: "middle",
        textStyle: { color: "#b8c0cc", fontSize: 11 },
      },
      series: [
        {
          name: "Account",
          type: "pie",
          radius: ["42%", "72%"],
          center: ["58%", "50%"],
          avoidLabelOverlap: true,
          label: { color: "#e8eaed" },
          data: parts.map((p) => ({ name: p.name, value: p.value })),
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 380 }} notMerge lazyUpdate />
  );
}

export const AccountDonutChart = memo(AccountDonutChartImpl);
