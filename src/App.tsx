import { useMemo } from "react";
import { FileInputs } from "@/components/FileInputs";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { TreemapChart } from "@/components/charts/TreemapChart";
import { PlanActivityChart } from "@/components/charts/PlanActivityChart";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { CalendarHeatmapChart } from "@/components/charts/CalendarHeatmapChart";
import { TransactionsTable } from "@/components/TransactionsTable";
import { getVisibleTransactions } from "@/lib/filterTx";
import { useAppStore } from "@/store/appStore";

export default function App() {
  const transactions = useAppStore((s) => s.transactions);
  const planRows = useAppStore((s) => s.planRows);
  const dateRange = useAppStore((s) => s.dateRange);
  const selection = useAppStore((s) => s.selection);
  const dateFormat = useAppStore((s) => s.dateFormat);
  const setSelection = useAppStore((s) => s.setSelection);

  const visible = useMemo(
    () => getVisibleTransactions(transactions, dateRange, selection),
    [transactions, dateRange, selection]
  );

  const hasData = transactions.length > 0;

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "1.5rem 1.25rem 3rem",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1
          style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}
        >
          YNAB charts
        </h1>
        <p style={{ margin: 0, color: "#b8c0cc", maxWidth: "52ch" }}>
          Load your exported Plan and Register CSVs to explore spending
          patterns. All processing happens in your browser.
        </p>
      </header>

      <FileInputs />

      {hasData ? (
        <>
          {dateFormat ? (
            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.9rem",
                color: "#9aa5b1",
              }}
            >
              Inferred register date format:{" "}
              <code style={{ color: "#c8e0ff" }}>{dateFormat}</code>
            </p>
          ) : null}

          <DateRangeFilter />

          {selection ? (
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ color: "#b8c0cc", fontSize: "0.9rem" }}>
                Filter:{" "}
                <strong>
                  {selection.categoryGroup}
                  {selection.category ? ` → ${selection.category}` : ""}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelection(null)}
                style={{
                  padding: "0.35rem 0.75rem",
                  background: "#2a3544",
                  border: "1px solid #3d4d60",
                  borderRadius: 6,
                  color: "#e8eaed",
                }}
              >
                Clear category filter
              </button>
            </div>
          ) : null}

          <CashflowChart transactions={transactions} dateRange={dateRange} />
          <TreemapChart transactions={transactions} dateRange={dateRange} />
          <PlanActivityChart planRows={planRows} />
          <SankeyChart transactions={transactions} dateRange={dateRange} />
          <CalendarHeatmapChart
            transactions={transactions}
            dateRange={dateRange}
          />
          <TransactionsTable rows={visible} />
        </>
      ) : null}
    </main>
  );
}
