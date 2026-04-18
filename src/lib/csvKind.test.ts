import { describe, expect, it } from "vitest";
import { detectCsvKind } from "./csvKind";
import { PLAN_FIXTURE, REGISTER_FIXTURE } from "@/__fixtures__/sampleCsv";

describe("detectCsvKind", () => {
  it("classifies register export", () => {
    expect(detectCsvKind(REGISTER_FIXTURE)).toBe("register");
  });

  it("classifies plan export", () => {
    expect(detectCsvKind(PLAN_FIXTURE)).toBe("plan");
  });

  it("returns null for unrelated text", () => {
    expect(detectCsvKind("a,b,c\n1,2,3")).toBe(null);
  });
});
