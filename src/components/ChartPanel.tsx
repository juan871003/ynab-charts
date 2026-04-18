import type { ReactNode } from "react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { FiltersPanel } from "@/components/filters/FiltersPanel";
import type { ChartId } from "@/lib/chartIds";

export function ChartPanel({
  title,
  description,
  chartId,
  children,
  controls,
}: {
  title: string;
  description?: string;
  chartId: ChartId;
  children: ReactNode;
  /** When set, replaces the default per-chart date range row. */
  controls?: ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: "1.75rem",
        padding: "1.25rem 1.25rem 1rem",
        border: "1px solid var(--ynab-border)",
        borderRadius: 12,
        background: "var(--ynab-panel)",
      }}
    >
      <header style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "var(--ynab-text)",
            letterSpacing: "0.01em",
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            style={{
              margin: "0.35rem 0 0",
              fontSize: "0.82rem",
              color: "var(--ynab-text-dim)",
              lineHeight: 1.45,
              maxWidth: "62ch",
            }}
          >
            {description}
          </p>
        ) : null}
        <FiltersPanel variant="chart">
          {controls ?? <DateRangeFilter chartId={chartId} />}
        </FiltersPanel>
      </header>
      {children}
    </section>
  );
}
