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
import { ui } from "@/lib/visualTheme";

/** Avoid ECharts “contrast” stroke (white-on-dark outline) on treemap tiles. */
const TREEMAP_LABEL = {
  color: ui.textPrimary,
  textBorderWidth: 0,
  textShadowBlur: 0,
  textShadowColor: "transparent",
} as const;

function TreemapChartImpl({
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
    const txs = filterRegisterForCharts(transactions, dateRange);
    const root = buildSpendingTreemap(txs);
    const opt = {
      title: { show: false },
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
          label: { show: true, fontSize: 11, ...TREEMAP_LABEL },
          upperLabel: { show: true, height: 20, ...TREEMAP_LABEL },
          emphasis: {
            label: { ...TREEMAP_LABEL },
            upperLabel: { ...TREEMAP_LABEL },
          },
          itemStyle: { borderColor: ui.pageBg },
          data: root.children ?? [],
        },
      ],
    };
    return { option: opt, dataRoot: root };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0 || !dataRoot.children?.length) return null;

  return (
    <>
      <ReactECharts
        option={option}
        style={{ height: 420 }}
        notMerge
        lazyUpdate
        onEvents={{
          click: (params: {
            event?: unknown;
            treePathInfo?: { name: string }[];
          }) => {
            if (params.event == null) return;
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
      <p
        style={{
          color: "var(--ynab-text-dim)",
          fontSize: "0.85rem",
          marginTop: 8,
        }}
      >
        Click a tile to filter the transaction table (category group or
        category).
      </p>
    </>
  );
}

export const TreemapChart = memo(TreemapChartImpl);
