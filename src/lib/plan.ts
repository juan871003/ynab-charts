import { rawPlanRowSchema, type PlanRow } from "./types";
import { parseMoney } from "./money";
import { parseCsvText } from "./parseCsv";
import { parsePlanMonthLabel } from "./dateInference";

export function parsePlanCsv(text: string): PlanRow[] {
  const { rows } = parseCsvText<Record<string, unknown>>(text);
  const out: PlanRow[] = [];

  for (const row of rows) {
    const parsed = rawPlanRowSchema.safeParse(row);
    if (!parsed.success) continue;
    const r = parsed.data;
    const monthDate = parsePlanMonthLabel(r.Month);
    if (!monthDate) continue;

    out.push({
      monthLabel: r.Month.trim(),
      monthDate,
      categoryGroupCategory: r["Category Group/Category"],
      categoryGroup: r["Category Group"],
      category: r.Category,
      assigned: parseMoney(r.Assigned),
      activity: parseMoney(r.Activity),
      available: parseMoney(r.Available),
    });
  }

  return out;
}
