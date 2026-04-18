import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  buildSpendingTreemap,
  filterTransactions,
  type DateRange,
} from "@/lib/aggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

export function TreemapChart({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const setSelection = useAppStore((s) => s.setSelection);
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "chart"),
    [displayCurrency]
  );

  const { option, dataRoot } = useMemo(() => {
    const txs = filterTransactions(transactions, dateRange);
    const root = buildSpendingTreemap(txs);
    const opt = {
      title: {
        text: "Spending by category (treemap)",
        left: "center",
        textStyle: { color: "#e8eaed" },
      },
      tooltip: {
        formatter: (info: { name: string; value: number }) =>
          `${info.name}: ${money.format(info.value)}`,
      },
      series: [
        {
          type: "treemap",
          roam: false,
          nodeClick: "zoomToNode",
          breadcrumb: { show: true },
          label: { show: true, color: "#fff", fontSize: 11 },
          upperLabel: { show: true },
          itemStyle: { borderColor: "#0f1419" },
          data: root.children ?? [],
        },
      ],
    };
    return { option: opt, dataRoot: root };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0 || !dataRoot.children?.length) return null;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts
        option={option}
        style={{ height: 420 }}
        notMerge
        lazyUpdate
        onEvents={{
          click: (params: { treePathInfo?: { name: string }[] }) => {
            const path = params.treePathInfo?.map((x) => x.name) ?? [];
            const segments = path[0] === "Spending" ? path.slice(1) : path;
            if (segments.length === 1) {
              setSelection({ categoryGroup: segments[0] });
            } else if (segments.length >= 2) {
              setSelection({
                categoryGroup: segments[0],
                category: segments[1],
              });
            }
          },
        }}
      />
      <p style={{ color: "#9aa5b1", fontSize: "0.85rem", marginTop: 8 }}>
        Click a tile to filter the transaction table (category group or
        category).
      </p>
    </div>
  );
}
