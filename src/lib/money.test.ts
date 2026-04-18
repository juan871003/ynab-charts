import { describe, expect, it } from "vitest";
import { parseMoney } from "./money";

describe("parseMoney", () => {
  it("parses USD with commas and sign", () => {
    expect(parseMoney("$1,217.91")).toBe(1217.91);
    expect(parseMoney("-$1571.54")).toBe(-1571.54);
    expect(parseMoney("$0.00")).toBe(0);
  });
});
