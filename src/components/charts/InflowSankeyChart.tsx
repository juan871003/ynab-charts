import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { filterRegisterForCharts, type DateRange } from "@/lib/aggregate";
import { buildInflowSankey } from "@/lib/galleryAggregate";
import type { NormalizedTransaction } from "@/lib/types";
import { ui } from "@/lib/visualTheme";

function InflowSankeyChartImpl({
  transactions,
  dateRange,
}: {
  transactions: NormalizedTransaction[];
  dateRange: DateRange | null;
}) {
  const option = useMemo(() => {
    const txs = filterRegisterForCharts(transactions, dateRange);
    const { nodes, links } = buildInflowSankey(txs);
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
          label: { color: ui.textPrimary },
        },
      ],
    };
  }, [transactions, dateRange]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 400 }} notMerge lazyUpdate />
  );
}

export const InflowSankeyChart = memo(InflowSankeyChartImpl);
