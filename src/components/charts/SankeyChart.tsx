import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  buildOutflowSankey,
  filterRegisterForCharts,
  type DateRange,
} from "@/lib/aggregate";
import type { NormalizedTransaction } from "@/lib/types";

function SankeyChartImpl({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const option = useMemo(() => {
    const txs = filterRegisterForCharts(transactions, dateRange);
    const { nodes, links } = buildOutflowSankey(txs);
    return {
      title: { show: false },
      tooltip: { trigger: "item" },
      series: [
        {
          type: "sankey",
          emphasis: { focus: "adjacency" },
          data: nodes,
          links: links.map((l) => ({
            ...l,
            lineStyle: { opacity: 0.35 },
          })),
          label: { color: "#e8eaed" },
        },
      ],
    };
  }, [transactions, dateRange]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 400 }} notMerge lazyUpdate />
  );
}

export const SankeyChart = memo(SankeyChartImpl);
