import type { ReactNode } from "react";

type Props = {
  variant?: "global" | "chart";
  children: ReactNode;
};

/** Shell for filters (date range now; more later). */
export function FiltersPanel({ variant = "global", children }: Props) {
  if (variant === "chart") {
    return (
      <div style={{ marginTop: "0.85rem", width: "100%" }}>{children}</div>
    );
  }

  return (
    <section
      style={{
        marginTop: "1rem",
        padding: "1rem 1.1rem",
        borderRadius: 12,
        border: "1px solid var(--ynab-border)",
        background: "var(--ynab-bg-elevated)",
      }}
    >
      <h2
        style={{
          margin: "0 0 0.75rem",
          fontSize: "0.95rem",
          fontWeight: 600,
          color: "var(--ynab-text-muted)",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        Filters
      </h2>
      {children}
    </section>
  );
}
