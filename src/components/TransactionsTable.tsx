import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useMemo } from "react";
import type { NormalizedTransaction } from "@/lib/types";

const money = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const columnHelper = createColumnHelper<NormalizedTransaction>();

export function TransactionsTable({ rows }: { rows: NormalizedTransaction[] }) {
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
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: "date", desc: true }] },
  });

  return (
    <section style={{ marginTop: "2rem", overflowX: "auto" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
        Transactions ({rows.length})
      </h2>
      <table style={{ width: "100%", fontSize: "0.85rem" }}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  style={{
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    borderBottom: "1px solid #2a3544",
                    color: "#b8c0cc",
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #1e2835" }}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ padding: "0.4rem 0.75rem", verticalAlign: "top" }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
