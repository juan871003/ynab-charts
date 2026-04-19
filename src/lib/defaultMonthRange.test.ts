import { describe, expect, it } from "vitest";
import {
  defaultFullRangeThroughLastCompleteMonth,
  defaultSingleMonthRange,
} from "@/lib/defaultMonthRange";
import { toMonthKey } from "@/lib/monthRange";
import type { NormalizedTransaction } from "@/lib/types";

function tx(dateStr: string): NormalizedTransaction {
  return {
    date: new Date(dateStr + "T12:00:00"),
    account: "A",
    payee: "P",
    categoryGroupCategory: "G/C",
    categoryGroup: "G",
    category: "C",
    memo: "",
    outflow: 10,
    inflow: 0,
    cleared: "",
  };
}

describe("defaultSingleMonthRange", () => {
  it("uses previous month when newest data is in the current calendar month", () => {
    const today = new Date("2026-04-19T12:00:00");
    const txs = [tx("2026-03-01"), tx("2026-04-16")];
    const r = defaultSingleMonthRange(txs, today);
    expect(r).not.toBeNull();
    expect(toMonthKey(r!.start)).toBe("2026-03");
    expect(toMonthKey(r!.end)).toBe("2026-03");
  });

  it("uses the latest month in data when that month is fully before today’s month", () => {
    const today = new Date("2026-04-19T12:00:00");
    const txs = [tx("2026-01-05"), tx("2026-02-28")];
    const r = defaultSingleMonthRange(txs, today);
    expect(r).not.toBeNull();
    expect(toMonthKey(r!.start)).toBe("2026-02");
  });

  it("falls back to full bounds when only the current partial month has rows", () => {
    const today = new Date("2026-04-19T12:00:00");
    const txs = [tx("2026-04-02"), tx("2026-04-16")];
    const r = defaultSingleMonthRange(txs, today);
    expect(r).not.toBeNull();
    expect(toMonthKey(r!.start)).toBe("2026-04");
    expect(toMonthKey(r!.end)).toBe("2026-04");
  });
});

describe("defaultFullRangeThroughLastCompleteMonth", () => {
  it("ends at the last complete month when data includes the current month", () => {
    const today = new Date("2026-04-19T12:00:00");
    const txs = [tx("2025-01-05"), tx("2026-03-20"), tx("2026-04-10")];
    const r = defaultFullRangeThroughLastCompleteMonth(txs, today);
    expect(r).not.toBeNull();
    expect(toMonthKey(r!.start)).toBe("2025-01");
    expect(toMonthKey(r!.end)).toBe("2026-03");
  });

  it("uses full bounds when only the current partial month exists", () => {
    const today = new Date("2026-04-19T12:00:00");
    const txs = [tx("2026-04-02"), tx("2026-04-16")];
    const r = defaultFullRangeThroughLastCompleteMonth(txs, today);
    expect(r).not.toBeNull();
    expect(toMonthKey(r!.start)).toBe("2026-04");
    expect(toMonthKey(r!.end)).toBe("2026-04");
  });
});
