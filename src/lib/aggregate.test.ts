import { describe, expect, it } from "vitest";
import { inferDateFormatFromSamples } from "./dateInference";
import { parseRegisterCsv } from "./register";
import { parsePlanCsv } from "./plan";
import { REGISTER_FIXTURE, PLAN_FIXTURE } from "@/__fixtures__/sampleCsv";
import {
  aggregateMonthlyCashflow,
  aggregatePlanActivityByCategoryInGroup,
  aggregatePlanActivityByGroup,
  buildSpendingTreemap,
  excludeUncategorizedAccountTransfers,
  filterPlanRowsByDateRange,
  filterRegisterForCharts,
  isUncategorizedAccountTransfer,
} from "./aggregate";
import type { NormalizedTransaction } from "./types";

describe("aggregations", () => {
  it("monthly cashflow matches fixture", () => {
    const fmt = inferDateFormatFromSamples(["15/01/2024", "16/01/2024"]);
    const txs = parseRegisterCsv(REGISTER_FIXTURE, fmt);
    const pts = aggregateMonthlyCashflow(txs);
    const jan = pts.find((p) => p.monthKey === "2024-01");
    expect(jan).toBeDefined();
    expect(jan!.inflow).toBe(5000);
    expect(jan!.outflow).toBeCloseTo(62, 5);
    expect(jan!.net).toBeCloseTo(5000 - 62, 5);
  });

  it("treemap rolls up category group and category", () => {
    const fmt = inferDateFormatFromSamples(["15/01/2024"]);
    const txs = parseRegisterCsv(REGISTER_FIXTURE, fmt);
    const tree = buildSpendingTreemap(txs);
    const food = tree.children?.find((c) => c.name === "Food");
    expect(food?.value).toBeCloseTo(62, 5);
    const groceries = food?.children?.find((c) => c.name === "Groceries");
    expect(groceries?.value).toBeCloseTo(62, 5);
  });

  it("plan activity by group stacks spending-side magnitude", () => {
    const rows = parsePlanCsv(PLAN_FIXTURE);
    const pts = aggregatePlanActivityByGroup(rows);
    const jan = pts.find((p) => p.monthKey === "2024-01");
    expect(jan?.byGroup.Food).toBeCloseTo(62, 5);
  });

  it("plan activity by category within a group splits by category name", () => {
    const rows = parsePlanCsv(PLAN_FIXTURE);
    const pts = aggregatePlanActivityByCategoryInGroup(rows, "Food");
    const jan = pts.find((p) => p.monthKey === "2024-01");
    expect(jan?.byGroup.Groceries).toBeCloseTo(62, 5);
  });

  it("flags uncategorized Transfer : payees as internal account moves", () => {
    const base: Omit<
      NormalizedTransaction,
      "payee" | "categoryGroup" | "category"
    > = {
      account: "A",
      date: new Date(2026, 2, 31),
      categoryGroupCategory: "",
      memo: "",
      outflow: 500,
      inflow: 0,
      cleared: "Reconciled",
    };
    expect(
      isUncategorizedAccountTransfer({
        ...base,
        payee: "Transfer : CBA Credit Card",
        categoryGroup: "",
        category: "",
      })
    ).toBe(true);
    expect(
      isUncategorizedAccountTransfer({
        ...base,
        payee: "Transfer : Loan Repayment - Juan",
        categoryGroup: "Finance",
        category: "Loan Repayment - Juan",
      })
    ).toBe(false);
  });

  it("filterRegisterForCharts drops uncategorized transfers from treemap totals", () => {
    const fmt = inferDateFormatFromSamples(["31/03/2026"]);
    const csv = `"Account","Flag","Date","Payee","Category Group/Category","Category Group","Category","Memo","Outflow","Inflow","Cleared"
"Juan ING","","31/03/2026","Transfer : CBA Credit Card","","","","",$500.00,$0.00,"Reconciled"
"CBA Credit Card","","31/03/2026","Transfer : Juan ING","","","","",$0.00,$500.00,"Reconciled"
"Juan ING","","31/03/2026","Store","Food: Groceries","Food","Groceries","",$40.00,$0.00,"Reconciled"
`;
    const txs = parseRegisterCsv(csv, fmt);
    const range = {
      start: new Date(2026, 2, 1),
      end: new Date(2026, 2, 31),
    };
    const forCharts = filterRegisterForCharts(txs, range);
    expect(forCharts.length).toBe(1);
    expect(excludeUncategorizedAccountTransfers(txs).length).toBe(1);
    const tree = buildSpendingTreemap(forCharts);
    const food = tree.children?.find((c) => c.name === "Food");
    expect(food?.value).toBeCloseTo(40, 5);
  });

  it("filterPlanRowsByDateRange keeps months overlapping the range", () => {
    const rows = parsePlanCsv(PLAN_FIXTURE);
    const janOverlap = filterPlanRowsByDateRange(rows, {
      start: new Date(2024, 0, 15),
      end: new Date(2024, 0, 20),
    });
    const janPts = aggregatePlanActivityByGroup(janOverlap);
    expect(janPts.some((p) => p.monthKey === "2024-01")).toBe(true);
    const noMarch = filterPlanRowsByDateRange(rows, {
      start: new Date(2024, 2, 1),
      end: new Date(2024, 2, 31),
    });
    expect(noMarch.length).toBe(0);
  });
});
