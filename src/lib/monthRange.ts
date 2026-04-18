import {
  addMonths,
  endOfMonth,
  format,
  max as dfMax,
  min as dfMin,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import type { DateRange } from "@/lib/aggregate";

/** `yyyy-MM` */
export type MonthKey = string;

export function toMonthKey(d: Date): MonthKey {
  return format(d, "yyyy-MM");
}

export function parseMonthKey(key: MonthKey): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function addMonthKey(key: MonthKey, delta: number): MonthKey {
  return toMonthKey(addMonths(parseMonthKey(key), delta));
}

/** Inclusive month span → inclusive date range clipped to `bounds`. */
export function monthKeysToClippedRange(
  startKey: MonthKey,
  endKey: MonthKey,
  bounds: DateRange
): DateRange | null {
  if (startKey > endKey) return null;
  const sm = startOfMonth(parseMonthKey(startKey));
  const em = endOfMonth(parseMonthKey(endKey));
  const start = dfMax([sm, bounds.start]);
  const end = dfMin([em, bounds.end]);
  if (start > end) return null;
  return { start, end };
}

export function dateRangeToMonthKeys(range: DateRange): {
  startKey: MonthKey;
  endKey: MonthKey;
} {
  return {
    startKey: toMonthKey(range.start),
    endKey: toMonthKey(range.end),
  };
}

export function isFullDataRange(range: DateRange, bounds: DateRange): boolean {
  return (
    range.start.getTime() === bounds.start.getTime() &&
    range.end.getTime() === bounds.end.getTime()
  );
}

export function isSingleMonthRange(
  startKey: MonthKey,
  endKey: MonthKey
): boolean {
  return startKey === endKey;
}

export type MonthRangePresetId =
  | "thisMonth"
  | "last3"
  | "last6"
  | "last12"
  | "ytd"
  | "lastYear"
  | "all";

export function applyPreset(
  id: MonthRangePresetId,
  bounds: DateRange,
  today: Date
): DateRange | null {
  const boundsMinKey = toMonthKey(bounds.start);
  const boundsMaxKey = toMonthKey(bounds.end);

  if (id === "all") {
    return bounds;
  }

  let startKey: MonthKey;
  let endKey: MonthKey;

  switch (id) {
    case "thisMonth": {
      startKey = toMonthKey(startOfMonth(today));
      endKey = toMonthKey(endOfMonth(today));
      break;
    }
    case "last3": {
      const start = startOfMonth(subMonths(today, 2));
      startKey = toMonthKey(start);
      endKey = toMonthKey(endOfMonth(today));
      break;
    }
    case "last6": {
      const start = startOfMonth(subMonths(today, 5));
      startKey = toMonthKey(start);
      endKey = toMonthKey(endOfMonth(today));
      break;
    }
    case "last12": {
      const start = startOfMonth(subMonths(today, 11));
      startKey = toMonthKey(start);
      endKey = toMonthKey(endOfMonth(today));
      break;
    }
    case "ytd": {
      const yStart = startOfYear(today);
      startKey = toMonthKey(yStart);
      endKey = toMonthKey(endOfMonth(today));
      break;
    }
    case "lastYear": {
      const y = today.getFullYear() - 1;
      startKey = `${y}-01`;
      endKey = `${y}-12`;
      break;
    }
    default:
      return null;
  }

  const lo = startKey >= boundsMinKey ? startKey : boundsMinKey;
  const hi = endKey <= boundsMaxKey ? endKey : boundsMaxKey;
  if (lo > hi) return null;
  return monthKeysToClippedRange(lo, hi, bounds);
}

/** Shift the selected month span by Δ months (treemap-style arrows). */
export function shiftMonthRangeByStep(
  current: DateRange,
  bounds: DateRange,
  delta: -1 | 1
): DateRange | null {
  const { startKey, endKey } = dateRangeToMonthKeys(current);
  const minK = toMonthKey(bounds.start);
  const maxK = toMonthKey(bounds.end);

  if (isSingleMonthRange(startKey, endKey)) {
    const nk = addMonthKey(startKey, delta);
    if (nk < minK || nk > maxK) return null;
    return monthKeysToClippedRange(nk, nk, bounds);
  }

  const ns = addMonthKey(startKey, delta);
  const ne = addMonthKey(endKey, delta);
  if (ns < minK || ne > maxK) return null;
  if (ns > ne) return null;
  return monthKeysToClippedRange(ns, ne, bounds);
}
