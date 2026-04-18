import type { ReactNode } from "react";

export function ChartSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginTop: "2.5rem" }}>
      <h2
        style={{
          margin: "0 0 1rem",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#e8eaed",
          borderBottom: "1px solid #2a3544",
          paddingBottom: "0.5rem",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
