import { describe, expect, it } from "vitest";
import { inferDateFormatFromSamples } from "./dateInference";
import { parseRegisterCsv } from "./register";
import { parsePlanCsv } from "./plan";
import { REGISTER_FIXTURE, PLAN_FIXTURE } from "@/__fixtures__/sampleCsv";
import {
  aggregateMonthlyCashflow,
  aggregatePlanActivityByGroup,
  buildSpendingTreemap,
} from "./aggregate";

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
});
