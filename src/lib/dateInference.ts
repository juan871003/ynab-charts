import { enUS } from "date-fns/locale";
import { isValid, parse } from "date-fns";

/** date-fns format strings tried against Register `Date` column samples. */
export const DATE_FORMAT_CANDIDATES = [
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "yyyy-MM-dd",
  "dd-MM-yyyy",
  "M/d/yyyy",
  "d/M/yyyy",
] as const;

export type InferredDateFormat = (typeof DATE_FORMAT_CANDIDATES)[number];

export function inferDateFormatFromSamples(
  dateStrings: string[],
  sampleSize = 200
): InferredDateFormat {
  const samples = dateStrings
    .filter((s) => s && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, sampleSize);

  if (samples.length === 0) return "dd/MM/yyyy";

  const scored = DATE_FORMAT_CANDIDATES.map((fmt) => {
    let ok = 0;
    for (const ds of samples) {
      const d = parse(ds, fmt, new Date(0));
      if (isValid(d)) ok += 1;
    }
    return { fmt, score: ok / samples.length };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  const top = scored.filter((s) => s.score === maxScore);
  if (top.length === 1) return top[0].fmt;

  // Tie-break: prefer format where first segment is often a day (>12).
  let best = top[0].fmt;
  let bestHint = -1;
  for (const t of top) {
    let hint = 0;
    for (const ds of samples.slice(0, 60)) {
      const p = ds.split(/[/-]/);
      if (p.length >= 2) {
        const a = Number(p[0]);
        if (a > 12 && a <= 31) hint += 1;
      }
    }
    if (hint > bestHint) {
      bestHint = hint;
      best = t.fmt;
    }
  }
  return best;
}

export function parseRegisterDate(
  raw: string,
  formatStr: InferredDateFormat
): Date | null {
  const d = parse(raw.trim(), formatStr, new Date(0));
  return isValid(d) ? d : null;
}

/** Plan file uses labels like `Jan 2024`. */
export function parsePlanMonthLabel(label: string): Date | null {
  const d = parse(label.trim(), "MMM yyyy", new Date(0), { locale: enUS });
  return isValid(d) ? d : null;
}
