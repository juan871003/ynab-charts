import Papa from "papaparse";
import { detectDelimiter } from "./parseCsv";

/** First line of CSV/TSV, handling quoted headers like YNAB exports. */
export function getCsvHeaders(text: string): string[] {
  const trimmed = text.trimStart();
  const nl = trimmed.search(/\r?\n/);
  const firstLine = nl === -1 ? trimmed : trimmed.slice(0, nl);
  if (!firstLine) return [];
  const delimiter = detectDelimiter(firstLine);
  const parsed = Papa.parse<string[]>(firstLine, { delimiter });
  const row = parsed.data[0];
  if (!row) return [];
  return row.map((h) => String(h).trim());
}

/** Register and Plan both include "Category Group"; only Register has cashflow columns. */
export function detectCsvKind(text: string): "register" | "plan" | null {
  const headers = getCsvHeaders(text);
  if (headers.length === 0) return null;
  const set = new Set(headers);
  if (set.has("Outflow")) return "register";
  if (set.has("Category Group")) return "plan";
  return null;
}
