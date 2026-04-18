import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { useMemo, useRef } from "react";
import { getCurrencyFormatter } from "@/lib/money";
import type { NormalizedTransaction } from "@/lib/types";
import { useAppStore } from "@/store/appStore";

const columnHelper = createColumnHelper<NormalizedTransaction>();

export function TransactionsTable({ rows }: { rows: NormalizedTransaction[] }) {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const money = useMemo(
    () => getCurrencyFormatter(displayCurrency, "table"),
    [displayCurrency]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor((r) => r.date, {
        id: "date",
        header: "Date",
        cell: (info) => format(info.getValue(), "yyyy-MM-dd"),
        sortingFn: (a, b) =>
          a.original.date.getTime() - b.original.date.getTime(),
      }),
      columnHelper.accessor("account", { header: "Account" }),
      columnHelper.accessor("payee", { header: "Payee" }),
      columnHelper.accessor("categoryGroup", { header: "Group" }),
      columnHelper.accessor("category", { header: "Category" }),
      columnHelper.accessor("outflow", {
        header: "Outflow",
        cell: (info) => money.format(info.getValue()),
      }),
      columnHelper.accessor("inflow", {
        header: "Inflow",
        cell: (info) => money.format(info.getValue()),
      }),
      columnHelper.accessor("memo", { header: "Memo" }),
    ],
    [money]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "date", desc: true }] },
  });

  const tableRows = table.getRowModel().rows;
  const colCount = table.getVisibleLeafColumns().length;

  const scrollParentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 40,
    overscan: 12,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <section style={{ marginTop: 0, overflowX: "auto" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
        Transactions ({rows.length})
      </h2>
      <div
        ref={scrollParentRef}
        style={{
          maxHeight: "min(70vh, 560px)",
          overflow: "auto",
          border: "1px solid var(--ynab-border)",
          borderRadius: 10,
        }}
      >
        <table
          style={{
            width: "100%",
            fontSize: "0.85rem",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              background: "var(--ynab-bg-elevated)",
              boxShadow: "0 1px 0 var(--ynab-border)",
            }}
          >
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      borderBottom: "1px solid var(--ynab-border)",
                      color: "var(--ynab-text-muted)",
                      cursor: h.column.getCanSort() ? "pointer" : undefined,
                    }}
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{
                      asc: " ▲",
                      desc: " ▼",
                    }[h.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 ? (
              <tr aria-hidden>
                <td
                  colSpan={colCount}
                  style={{
                    height: paddingTop,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            ) : null}
            {virtualRows.map((vr) => {
              const row = tableRows[vr.index];
              return (
                <tr
                  key={row.id}
                  data-index={vr.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    borderBottom: "1px solid rgba(46, 46, 66, 0.55)",
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        padding: "0.4rem 0.75rem",
                        verticalAlign: "top",
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 ? (
              <tr aria-hidden>
                <td
                  colSpan={colCount}
                  style={{
                    height: paddingBottom,
                    padding: 0,
                    border: "none",
                  }}
                />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
