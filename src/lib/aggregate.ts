import {
  endOfMonth,
  format,
  max as dfMax,
  min as dfMin,
  startOfMonth,
} from "date-fns";
import type { NormalizedTransaction } from "./types";
import type { PlanRow } from "./types";

export interface DateRange {
  start: Date;
  end: Date;
}

export function inDateRange(d: Date, range: DateRange | null): boolean {
  if (!range) return true;
  const t = d.getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

/**
 * YNAB uses `Transfer : {account name}` for on-budget account moves. When both
 * category group and category are empty, the row is not spending/income — exclude
 * it from spending/cashflow charts. (Categorized transfers, e.g. loan payments,
 * stay included.)
 */
const UNCATEGORIZED_TRANSFER_PAYEE = /^\s*Transfer\s*:\s*\S/is;

export function isUncategorizedAccountTransfer(
  t: NormalizedTransaction
): boolean {
  if (!UNCATEGORIZED_TRANSFER_PAYEE.test(t.payee)) return false;
  return !t.categoryGroup.trim() && !t.category.trim();
}

export function excludeUncategorizedAccountTransfers(
  txs: NormalizedTransaction[]
): NormalizedTransaction[] {
  return txs.filter((t) => !isUncategorizedAccountTransfer(t));
}

export function filterTransactions(
  txs: NormalizedTransaction[],
  range: DateRange | null
): NormalizedTransaction[] {
  if (!range) return txs;
  return txs.filter((t) => inDateRange(t.date, range));
}

/** Date range plus exclusion of uncategorized account-to-account transfers (for charts). */
export function filterRegisterForCharts(
  txs: NormalizedTransaction[],
  range: DateRange | null
): NormalizedTransaction[] {
  return excludeUncategorizedAccountTransfers(filterTransactions(txs, range));
}

export function getTransactionDateBounds(
  txs: NormalizedTransaction[]
): DateRange | null {
  if (txs.length === 0) return null;
  let min = txs[0].date.getTime();
  let max = txs[0].date.getTime();
  for (const t of txs) {
    const x = t.date.getTime();
    if (x < min) min = x;
    if (x > max) max = x;
  }
  return { start: new Date(min), end: new Date(max) };
}

export function intersectDateRanges(
  a: DateRange,
  b: DateRange
): DateRange | null {
  const start = dfMax([a.start, b.start]);
  const end = dfMin([a.end, b.end]);
  if (start > end) return null;
  return { start, end };
}

function monthKeyBoundsInTransactions(
  txs: NormalizedTransaction[],
  clip: DateRange | null
): { min: string | null; max: string | null } {
  const filtered = filterTransactions(txs, clip);
  if (filtered.length === 0) return { min: null, max: null };
  let minT = filtered[0].date.getTime();
  let maxT = filtered[0].date.getTime();
  let minKey = format(filtered[0].date, "yyyy-MM");
  let maxKey = format(filtered[0].date, "yyyy-MM");
  for (const t of filtered) {
    const x = t.date.getTime();
    if (x < minT) {
      minT = x;
      minKey = format(t.date, "yyyy-MM");
    }
    if (x > maxT) {
      maxT = x;
      maxKey = format(t.date, "yyyy-MM");
    }
  }
  return { min: minKey, max: maxKey };
}

/** Latest calendar month (yyyy-MM) among transactions inside `clip`. */
export function latestMonthKeyInTransactions(
  txs: NormalizedTransaction[],
  clip: DateRange | null
): string | null {
  return monthKeyBoundsInTransactions(txs, clip).max;
}

export function monthKeyBoundsForTreemap(
  txs: NormalizedTransaction[],
  clip: DateRange
): { min: string | null; max: string | null } {
  return monthKeyBoundsInTransactions(txs, clip);
}

export function monthKeyToClippedRange(
  monthKey: string,
  clip: DateRange
): DateRange | null {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return null;
  const start = startOfMonth(new Date(y, m - 1, 1));
  const end = endOfMonth(start);
  return intersectDateRanges({ start, end }, clip);
}

export type TreemapViewMode = "month" | "range";

/**
 * If `explicitMonthKey` overlaps the global clip, use it; otherwise the latest
 * month in-range (same as null).
 */
export function resolveTreemapMonthKey(
  txs: NormalizedTransaction[],
  clip: DateRange,
  explicitMonthKey: string | null
): string | null {
  const latest = latestMonthKeyInTransactions(txs, clip);
  if (!explicitMonthKey) return latest;
  if (monthKeyToClippedRange(explicitMonthKey, clip)) return explicitMonthKey;
  return latest;
}

export function getTreemapFilterRange(options: {
  transactions: NormalizedTransaction[];
  globalRange: DateRange | null;
  mode: TreemapViewMode;
  treemapMonthKey: string | null;
  treemapRangeOverride: DateRange | null;
}): DateRange | null {
  const {
    transactions,
    globalRange,
    mode,
    treemapMonthKey,
    treemapRangeOverride,
  } = options;
  const bounds = getTransactionDateBounds(transactions);
  if (!bounds) return null;
  const clip = globalRange ?? bounds;

  if (mode === "range") {
    return treemapRangeOverride ?? clip;
  }

  const resolved = resolveTreemapMonthKey(transactions, clip, treemapMonthKey);
  if (!resolved) return null;
  return monthKeyToClippedRange(resolved, clip);
}

/** Keep plan rows whose month overlaps the inclusive date range. */
export function filterPlanRowsByDateRange(
  rows: PlanRow[],
  range: DateRange | null
): PlanRow[] {
  if (!range) return rows;
  const rs = range.start.getTime();
  const re = range.end.getTime();
  return rows.filter((r) => {
    const ms = r.monthDate.getTime();
    const me = endOfMonth(r.monthDate).getTime();
    return me >= rs && ms <= re;
  });
}

export interface MonthlyCashflowPoint {
  monthKey: string;
  label: string;
  inflow: number;
  outflow: number;
  net: number;
}

export function aggregateMonthlyCashflow(
  txs: NormalizedTransaction[]
): MonthlyCashflowPoint[] {
  const map = new Map<string, { inflow: number; outflow: number }>();

  for (const t of txs) {
    const key = format(t.date, "yyyy-MM");
    const cur = map.get(key) ?? { inflow: 0, outflow: 0 };
    cur.inflow += t.inflow;
    cur.outflow += t.outflow;
    map.set(key, cur);
  }

  const keys = [...map.keys()].sort();
  return keys.map((monthKey) => {
    const v = map.get(monthKey)!;
    const [y, m] = monthKey.split("-").map(Number);
    const label = format(new Date(y, m - 1, 1), "MMM yyyy");
    return {
      monthKey,
      label,
      inflow: v.inflow,
      outflow: v.outflow,
      net: v.inflow - v.outflow,
    };
  });
}

/** Treemap: category group → category, value = sum of outflows (spending). */
export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
}

export function buildSpendingTreemap(
  txs: NormalizedTransaction[]
): TreemapNode {
  const groupMap = new Map<string, Map<string, number>>();

  for (const t of txs) {
    const g = t.categoryGroup.trim() || "(Uncategorized)";
    const c = t.category.trim() || "(Uncategorized)";
    if (!groupMap.has(g)) groupMap.set(g, new Map());
    const cm = groupMap.get(g)!;
    cm.set(c, (cm.get(c) ?? 0) + t.outflow);
  }

  const children: TreemapNode[] = [];
  for (const [groupName, catMap] of groupMap) {
    const catChildren: TreemapNode[] = [];
    let groupTotal = 0;
    for (const [catName, val] of catMap) {
      groupTotal += val;
      catChildren.push({ name: catName, value: val });
    }
    children.push({
      name: groupName,
      value: groupTotal,
      children: catChildren,
    });
  }

  return { name: "Spending", children };
}

export interface PlanStackPoint {
  monthKey: string;
  label: string;
  /** Per category group: summed "outflow" activity (positive number). */
  byGroup: Record<string, number>;
}

/**
 * Stack Plan `Activity` by month and category group.
 * Uses spending-side magnitude: sum of max(0, -activity) per row, then summed by group.
 */
export function aggregatePlanActivityByGroup(
  rows: PlanRow[]
): PlanStackPoint[] {
  const map = new Map<string, Record<string, number>>();

  for (const r of rows) {
    const key = format(r.monthDate, "yyyy-MM");
    const g = r.categoryGroup.trim() || "(Uncategorized)";
    const spend = Math.max(0, -r.activity);
    if (!map.has(key)) map.set(key, {});
    const rec = map.get(key)!;
    rec[g] = (rec[g] ?? 0) + spend;
  }

  const keys = [...map.keys()].sort();
  return keys.map((monthKey) => {
    const [y, m] = monthKey.split("-").map(Number);
    const label = format(new Date(y, m - 1, 1), "MMM yyyy");
    return {
      monthKey,
      label,
      byGroup: map.get(monthKey) ?? {},
    };
  });
}

/** Daily total outflow for calendar heatmap. */
export function aggregateDailyOutflow(
  txs: NormalizedTransaction[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of txs) {
    const key = format(t.date, "yyyy-MM-dd");
    map.set(key, (map.get(key) ?? 0) + t.outflow);
  }
  return map;
}

/** Sankey: one source "Outflows" linking to each category group (outflow totals). */
export function buildOutflowSankey(txs: NormalizedTransaction[]): {
  nodes: { name: string }[];
  links: { source: string; target: string; value: number }[];
} {
  const groupTotals = new Map<string, number>();
  for (const t of txs) {
    const g = t.categoryGroup.trim() || "(Uncategorized)";
    groupTotals.set(g, (groupTotals.get(g) ?? 0) + t.outflow);
  }

  const entries = [...groupTotals.entries()].filter(([, v]) => v > 0);
  const nodes = [{ name: "Outflows" }, ...entries.map(([name]) => ({ name }))];
  const links = entries.map(([target, value]) => ({
    source: "Outflows",
    target,
    value,
  }));

  return { nodes, links };
}
