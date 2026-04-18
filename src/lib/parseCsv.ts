import Papa from "papaparse";

export type Delimiter = "," | "\t";

export function detectDelimiter(headerLine: string): Delimiter {
  const tab = (headerLine.match(/\t/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return tab > comma ? "\t" : ",";
}

export function parseCsvText<T extends Record<string, unknown>>(
  text: string
): { rows: T[]; delimiter: Delimiter } {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const parsed = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.find(
      (e) => e.type === "Quotes" || e.type === "Delimiter"
    );
    if (fatal) {
      throw new Error(`CSV parse error: ${fatal.message}`);
    }
  }
  return {
    rows: (parsed.data as T[]).filter((r) => Object.keys(r).length > 0),
    delimiter,
  };
}
