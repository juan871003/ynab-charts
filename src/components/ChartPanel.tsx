import type { ReactNode } from "react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
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
        border: "1px solid #2f3a49",
        borderRadius: 10,
        background: "#151a22",
      }}
    >
      <header style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#e8eaed",
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
              color: "#9aa5b1",
              lineHeight: 1.45,
              maxWidth: "62ch",
            }}
          >
            {description}
          </p>
        ) : null}
        <div style={{ marginTop: "0.85rem" }}>
          {controls ?? <DateRangeFilter chartId={chartId} />}
        </div>
      </header>
      {children}
    </section>
  );
}
