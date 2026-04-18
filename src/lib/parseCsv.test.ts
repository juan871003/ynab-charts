import { describe, expect, it } from "vitest";
import { parseCsvText } from "./parseCsv";
import { REGISTER_FIXTURE } from "@/__fixtures__/sampleCsv";

describe("parseCsvText", () => {
  it("parses quoted YNAB register header and rows", () => {
    const { rows, delimiter } =
      parseCsvText<Record<string, string>>(REGISTER_FIXTURE);
    expect(delimiter).toBe(",");
    expect(rows.length).toBe(3);
    expect(rows[0].Date).toBe("15/01/2024");
    expect(rows[1].Outflow).toBe("$50.00");
  });
});
