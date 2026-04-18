import { z } from "zod";
import type { InferredDateFormat } from "./dateInference";
import { parseRegisterDate } from "./dateInference";
import { parseMoney } from "./money";
import { parseCsvText } from "./parseCsv";
import { rawRegisterRowSchema, type NormalizedTransaction } from "./types";

export function parseRegisterCsv(
  text: string,
  dateFormat: InferredDateFormat
): NormalizedTransaction[] {
  const { rows } = parseCsvText<Record<string, unknown>>(text);
  const out: NormalizedTransaction[] = [];

  for (const row of rows) {
    const parsed = rawRegisterRowSchema.safeParse(row);
    if (!parsed.success) continue;

    const r = parsed.data;
    const date = parseRegisterDate(r.Date, dateFormat);
    if (!date) continue;

    out.push({
      account: r.Account,
      date,
      payee: r.Payee,
      categoryGroupCategory: r["Category Group/Category"],
      categoryGroup: r["Category Group"],
      category: r.Category,
      memo: r.Memo,
      outflow: parseMoney(r.Outflow),
      inflow: parseMoney(r.Inflow),
      cleared: r.Cleared,
    });
  }

  return out;
}

export function extractRegisterDateStrings(text: string): string[] {
  const { rows } = parseCsvText<Record<string, unknown>>(text);
  const dates: string[] = [];
  for (const row of rows) {
    const d = z.object({ Date: z.string() }).safeParse(row);
    if (d.success) dates.push(d.data.Date);
  }
  return dates;
}
