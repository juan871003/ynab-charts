import { useEffect, useMemo, useState } from "react";
import { FileInputs } from "@/components/FileInputs";
import { CurrencySelect } from "@/components/CurrencySelect";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { FiltersPanel } from "@/components/filters/FiltersPanel";
import {
  GalleryChartBlocks,
  OverviewChartBlocks,
} from "@/components/ChartSections";
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
        <p
          style={{
            margin: 0,
            color: "var(--ynab-text-muted)",
            maxWidth: "52ch",
          }}
        >
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
                color: "var(--ynab-text-dim)",
              }}
            >
              Inferred register date format:{" "}
              <code style={{ color: "var(--ynab-code)" }}>{dateFormat}</code>
            </p>
          ) : null}

          <FiltersPanel variant="global">
            <DateRangeFilter />
          </FiltersPanel>

          {selection ? (
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{ color: "var(--ynab-text-muted)", fontSize: "0.9rem" }}
              >
                Filter:{" "}
                <strong>
                  {selection.categoryGroup}
                  {selection.category ? ` → ${selection.category}` : ""}
                </strong>
              </span>
              <button
                type="button"
                className="ynab-btn ynab-btn--secondary ynab-btn--sm"
                onClick={() => setSelection(null)}
              >
                Clear category filter
              </button>
            </div>
          ) : null}

          <OverviewChartBlocks />
          <GalleryChartBlocks />

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
                    className="ynab-btn ynab-btn--secondary ynab-btn--sm"
                    onClick={() => setShowTransactionsTable(false)}
                  >
                    Hide transactions
                  </button>
                </div>
                <TransactionsTable rows={visible} />
              </>
            ) : (
              <button
                type="button"
                className="ynab-btn ynab-btn--secondary"
                onClick={() => setShowTransactionsTable(true)}
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
