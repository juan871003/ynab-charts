import { useEffect, useMemo, useState } from "react";
import { FileInputs } from "@/components/FileInputs";
import { CurrencySelect } from "@/components/CurrencySelect";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { TreemapChart } from "@/components/charts/TreemapChart";
import { PlanActivityChart } from "@/components/charts/PlanActivityChart";
import { SankeyChart } from "@/components/charts/SankeyChart";
import { CalendarHeatmapChart } from "@/components/charts/CalendarHeatmapChart";
import { DayOfWeekChart } from "@/components/charts/DayOfWeekChart";
import { TopPayeesChart } from "@/components/charts/TopPayeesChart";
import { AccountDonutChart } from "@/components/charts/AccountDonutChart";
import { RegisterStackedAreaChart } from "@/components/charts/RegisterStackedAreaChart";
import { MonthlyScatterChart } from "@/components/charts/MonthlyScatterChart";
import { RadarCompareChart } from "@/components/charts/RadarCompareChart";
import { NetWaterfallChart } from "@/components/charts/NetWaterfallChart";
import { SunburstSpendingChart } from "@/components/charts/SunburstSpendingChart";
import { InflowSankeyChart } from "@/components/charts/InflowSankeyChart";
import { ChartSection } from "@/components/ChartSection";
import { TransactionsTable } from "@/components/TransactionsTable";
import { getVisibleTransactions } from "@/lib/filterTx";
import { loadPersisted } from "@/lib/persistedData";
import { useAppStore } from "@/store/appStore";

export default function App() {
  useEffect(() => {
    const saved = loadPersisted();
    if (!saved) return;
    useAppStore.getState().setFromFiles(saved.registerCsv, saved.planCsv, {
      loadedAt: saved.lastLoadedAt,
      persist: false,
    });
  }, []);

  const transactions = useAppStore((s) => s.transactions);
  const planRows = useAppStore((s) => s.planRows);
  const dateRange = useAppStore((s) => s.dateRange);
  const selection = useAppStore((s) => s.selection);
  const dateFormat = useAppStore((s) => s.dateFormat);
  const setSelection = useAppStore((s) => s.setSelection);

  const [showTransactionsTable, setShowTransactionsTable] = useState(false);

  const visible = useMemo(
    () =>
      showTransactionsTable
        ? getVisibleTransactions(transactions, dateRange, selection)
        : [],
    [transactions, dateRange, selection, showTransactionsTable]
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

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <CurrencySelect />
      </div>

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

          <ChartSection title="Overview">
            <CashflowChart transactions={transactions} dateRange={dateRange} />
            <TreemapChart transactions={transactions} dateRange={dateRange} />
            <PlanActivityChart planRows={planRows} />
            <SankeyChart transactions={transactions} dateRange={dateRange} />
            <CalendarHeatmapChart
              transactions={transactions}
              dateRange={dateRange}
            />
          </ChartSection>

          <ChartSection title="Gallery — more chart types">
            <DayOfWeekChart transactions={transactions} dateRange={dateRange} />
            <TopPayeesChart transactions={transactions} dateRange={dateRange} />
            <AccountDonutChart transactions={transactions} dateRange={dateRange} />
            <RegisterStackedAreaChart
              transactions={transactions}
              dateRange={dateRange}
            />
            <MonthlyScatterChart
              transactions={transactions}
              dateRange={dateRange}
            />
            <RadarCompareChart
              transactions={transactions}
              dateRange={dateRange}
            />
            <NetWaterfallChart transactions={transactions} dateRange={dateRange} />
            <SunburstSpendingChart
              transactions={transactions}
              dateRange={dateRange}
            />
            <InflowSankeyChart transactions={transactions} dateRange={dateRange} />
          </ChartSection>

          <section style={{ marginTop: "2rem" }}>
            {showTransactionsTable ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowTransactionsTable(false)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      background: "#2a3544",
                      border: "1px solid #3d4d60",
                      borderRadius: 6,
                      color: "#e8eaed",
                      fontSize: "0.9rem",
                    }}
                  >
                    Hide transactions
                  </button>
                </div>
                <TransactionsTable rows={visible} />
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowTransactionsTable(true)}
                style={{
                  padding: "0.5rem 0.9rem",
                  background: "#2a3544",
                  border: "1px solid #3d4d60",
                  borderRadius: 6,
                  color: "#e8eaed",
                  fontSize: "0.9rem",
                }}
              >
                Show transactions table
              </button>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
