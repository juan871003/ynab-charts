import { memo, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { filterRegisterForCharts, type DateRange } from "@/lib/aggregate";
import { topPayeesPareto } from "@/lib/galleryAggregate";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";
import { ui } from "@/lib/visualTheme";

function TopPayeesChartImpl({
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
    const rows = topPayeesPareto(txs, 15);
    const labels = rows.map((r) => r.payee);
    return {
      title: { show: false },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (
          params: { seriesName: string; value: number; name: string }[]
        ) => {
          const lines = params.map((p) => {
            if (p.seriesName === "Cumulative %")
              return `${p.seriesName}: ${(p.value * 100).toFixed(1)}%`;
            return `${p.seriesName}: ${money.format(p.value)}`;
          });
          return `${params[0]?.name ?? ""}<br/>${lines.join("<br/>")}`;
        },
      },
      legend: {
        data: ["Outflow", "Cumulative %"],
        bottom: 0,
        textStyle: { color: ui.title },
      },
      grid: { left: 120, right: 56, top: 28, bottom: 56 },
      xAxis: [
        {
          type: "value",
          axisLabel: {
            color: ui.axisLabel,
            formatter: (v: number) => money.format(v),
          },
          splitLine: { lineStyle: { color: ui.splitLine } },
        },
        {
          type: "value",
          max: 1,
          axisLabel: {
            color: ui.axisLabel,
            formatter: (v: number) => `${(v * 100).toFixed(0)}%`,
          },
          splitLine: { show: false },
        },
      ],
      yAxis: {
        type: "category",
        data: labels,
        inverse: true,
        axisLabel: { color: ui.axisLabel, fontSize: 11 },
      },
      series: [
        {
          name: "Outflow",
          type: "bar",
          xAxisIndex: 0,
          data: rows.map((r) => r.total),
          itemStyle: { color: "#c8e65c" },
        },
        {
          name: "Cumulative %",
          type: "line",
          xAxisIndex: 1,
          data: rows.map((r) => r.cumulativeShare),
          itemStyle: { color: "#f2c14e" },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    };
  }, [transactions, dateRange, money]);

  if (transactions.length === 0) return null;

  return (
    <ReactECharts option={option} style={{ height: 420 }} notMerge lazyUpdate />
  );
}

export const TopPayeesChart = memo(TopPayeesChartImpl);
