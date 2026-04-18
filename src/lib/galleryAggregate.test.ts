import { describe, expect, it } from "vitest";
import { inferDateFormatFromSamples } from "./dateInference";
import { parseRegisterCsv } from "./register";
import { REGISTER_FIXTURE } from "@/__fixtures__/sampleCsv";
import {
  aggregateRegisterOutflowByGroupMonthly,
  aggregateWeekdayOutflow,
  mondayFirstWeekdayIndex,
  radarGroupOutflowIndexed,
  topPayeesPareto,
  waterfallSeriesFromMonthlyNet,
} from "./galleryAggregate";
import { aggregateMonthlyCashflow } from "./aggregate";

describe("galleryAggregate", () => {
  const txs = (() => {
    const fmt = inferDateFormatFromSamples(["15/01/2024", "16/01/2024"]);
    return parseRegisterCsv(REGISTER_FIXTURE, fmt);
  })();

  it("mondayFirstWeekdayIndex maps 16 Jan 2024 (Tue) to index 1", () => {
    const d = txs[1]!.date;
    expect(d.getFullYear()).toBe(2024);
    expect(mondayFirstWeekdayIndex(d)).toBe(1);
  });

  it("aggregateWeekdayOutflow sums Groceries days", () => {
    const pts = aggregateWeekdayOutflow(txs);
    const tue = pts.find((p) => p.label === "Tue");
    expect(tue?.sumOutflow).toBeCloseTo(62, 5);
    expect(tue?.transactionCount).toBe(2);
  });

  it("topPayeesPareto ranks Store and Cafe", () => {
    const rows = topPayeesPareto(txs, 10);
    expect(rows[0]?.payee).toBe("Store");
    expect(rows[1]?.payee).toBe("Cafe");
    expect(rows[rows.length - 1]?.cumulativeShare).toBeCloseTo(1, 5);
  });

  it("aggregateRegisterOutflowByGroupMonthly rolls Food in Jan 2024", () => {
    const pts = aggregateRegisterOutflowByGroupMonthly(txs);
    const jan = pts.find((p) => p.monthKey === "2024-01");
    expect(jan?.byGroup.Food).toBeCloseTo(62, 5);
  });

  it("radarGroupOutflowIndexed indexes Food at 100 when baseline matches current", () => {
    const r = radarGroupOutflowIndexed(txs, txs, 8);
    expect(r.groups).toContain("Food");
    const iFood = r.groups.indexOf("Food");
    expect(r.baseline[iFood]).toBe(100);
    expect(r.current[iFood]).toBe(100);
  });

  it("waterfallSeriesFromMonthlyNet stacks base + net to cumulative", () => {
    const monthly = aggregateMonthlyCashflow(txs);
    const w = waterfallSeriesFromMonthlyNet(monthly);
    expect(w.categories.length).toBe(monthly.length);
    const lastIdx = w.nets.length - 1;
    expect(w.base[lastIdx]! + w.nets[lastIdx]!).toBeCloseTo(
      w.cumulativeEnd[lastIdx]!,
      5
    );
  });
});
