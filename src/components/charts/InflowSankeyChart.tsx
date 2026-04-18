import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { filterTransactions, type DateRange } from "@/lib/aggregate";
import { buildInflowSankey } from "@/lib/galleryAggregate";
import type { NormalizedTransaction } from "@/lib/types";

export function InflowSankeyChart({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const option = useMemo(() => {
    const txs = filterTransactions(transactions, dateRange);
    const { nodes, links } = buildInflowSankey(txs);
    return {
      title: {
        text: "Inflows → category groups (Sankey)",
        left: "center",
        textStyle: { color: "#e8eaed" },
      },
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
    <div style={{ marginTop: "1.5rem" }}>
      <ReactECharts option={option} style={{ height: 400 }} notMerge lazyUpdate />
    </div>
  );
}
