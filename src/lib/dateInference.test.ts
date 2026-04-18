import { describe, expect, it } from "vitest";
import {
  inferDateFormatFromSamples,
  parseRegisterDate,
  parsePlanMonthLabel,
} from "./dateInference";

describe("inferDateFormatFromSamples", () => {
  it("infers DD/MM/YYYY for day-first samples", () => {
    const fmt = inferDateFormatFromSamples([
      "18/04/2026",
      "17/04/2026",
      "15/01/2024",
    ]);
    expect(fmt).toBe("dd/MM/yyyy");
  });

  it("parses register dates with inferred format", () => {
    const fmt = inferDateFormatFromSamples(["15/01/2024"]);
    const d = parseRegisterDate("15/01/2024", fmt);
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(15);
  });
});

describe("parsePlanMonthLabel", () => {
  it("parses MMM yyyy", () => {
    const d = parsePlanMonthLabel("Jan 2024");
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(0);
  });
});
