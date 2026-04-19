import { endOfMonth } from "date-fns";
import type { DateRange } from "@/lib/aggregate";
import type { NormalizedTransaction } from "@/lib/types";
import {
  addMonthKey,
  monthKeysToClippedRange,
  parseMonthKey,
  toMonthKey,
  type MonthKey,
} from "@/lib/monthRange";

function transactionBounds(txs: NormalizedTransaction[]): DateRange {
  let min = txs[0].date.getTime();
  let max = txs[0].date.getTime();
  for (const t of txs) {
    const x = t.date.getTime();
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { start: new Date(min), end: new Date(max) };
}

/**
 * Latest month in the export that we treat as “complete” for defaults: if the
 * newest transaction falls in the current calendar month, we use the prior month
 * instead so partial months don’t skew aggregates.
 */
function latestCompleteMonthKey(bounds: DateRange, today: Date): MonthKey {
  const mDataMax = toMonthKey(bounds.end);
  const mToday = toMonthKey(today);
  if (mDataMax === mToday) {
    return addMonthKey(mToday, -1);
  }
  return mDataMax;
}

/**
 * Default filter: one calendar month. Uses the latest complete month in the
 * export (never the in-progress current month when data extends into it). If
 * that month has no rows (e.g. gap in data), walks backward; if the export only
 * contains the current partial month, uses that clipped span.
 */
export function defaultSingleMonthRange(
  txs: NormalizedTransaction[],
  today: Date = new Date()
): DateRange | null {
  if (txs.length === 0) return null;

  const bounds = transactionBounds(txs);
  const minKey = toMonthKey(bounds.start);
  const ideal = latestCompleteMonthKey(bounds, today);

  let attempt: MonthKey = ideal >= minKey ? ideal : minKey;

  while (attempt >= minKey) {
    const r = monthKeysToClippedRange(attempt, attempt, bounds);
    if (r) return r;
    attempt = addMonthKey(attempt, -1);
  }

  return { start: bounds.start, end: bounds.end };
}

/**
 * From first transaction through the end of the latest *complete* month in the
 * export (excludes the in-progress current month when the newest row is this month).
 */
export function defaultFullRangeThroughLastCompleteMonth(
  txs: NormalizedTransaction[],
  today: Date = new Date()
): DateRange | null {
  if (txs.length === 0) return null;

  const bounds = transactionBounds(txs);
  const minKey = toMonthKey(bounds.start);
  const idealEndMonthKey = latestCompleteMonthKey(bounds, today);

  if (idealEndMonthKey < minKey) {
    return { start: bounds.start, end: bounds.end };
  }

  const endOfLastComplete = endOfMonth(parseMonthKey(idealEndMonthKey));
  const end =
    endOfLastComplete.getTime() <= bounds.end.getTime()
      ? endOfLastComplete
      : bounds.end;

  if (bounds.start.getTime() > end.getTime()) {
    return { start: bounds.start, end: bounds.end };
  }

  return { start: bounds.start, end };
}
