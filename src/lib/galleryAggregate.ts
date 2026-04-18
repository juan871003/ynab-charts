import { format } from "date-fns";
import type { NormalizedTransaction } from "./types";
import type { MonthlyCashflowPoint } from "./aggregate";
const WEEKDAY_LABELS_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Map JS getDay() (Sun=0) to Mon=0 … Sun=6. */
export function mondayFirstWeekdayIndex(d: Date): number {
  const js = d.getDay();
  return js === 0 ? 6 : js - 1;
}

export interface WeekdayOutflowPoint {
  /** Mon=0 … Sun=6 */
  weekdayIndex: number;
  label: string;
  /** Mean outflow per transaction-day bucket (sum/count). */
  meanOutflow: number;
  transactionCount: number;
  sumOutflow: number;
}

export function aggregateWeekdayOutflow(
  txs: NormalizedTransaction[]
): WeekdayOutflowPoint[] {
  const sums = new Map<number, number>();
  const counts = new Map<number, number>();
  for (const t of txs) {
    const i = mondayFirstWeekdayIndex(t.date);
    sums.set(i, (sums.get(i) ?? 0) + t.outflow);
    counts.set(i, (counts.get(i) ?? 0) + 1);
  }
  return WEEKDAY_LABELS_MON_FIRST.map((label, weekdayIndex) => {
    const c = counts.get(weekdayIndex) ?? 0;
    const s = sums.get(weekdayIndex) ?? 0;
    return {
      weekdayIndex,
      label,
      meanOutflow: c > 0 ? s / c : 0,
      transactionCount: c,
      sumOutflow: s,
    };
  });
}

export interface NamedAmount {
  name: string;
  value: number;
}

export function topNByOutflow(
  txs: NormalizedTransaction[],
  key: (t: NormalizedTransaction) => string,
  topN = 15
): NamedAmount[] {
  const map = new Map<string, number>();
  for (const t of txs) {
    const k = key(t).trim() || "(empty)";
    map.set(k, (map.get(k) ?? 0) + t.outflow);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherSum = rest.reduce((a, [, v]) => a + v, 0);
  const out: NamedAmount[] = head.map(([name, value]) => ({ name, value }));
  if (otherSum > 0) out.push({ name: "Other", value: otherSum });
  return out;
}

export interface PayeeParetoRow {
  payee: string;
  total: number;
  share: number;
  cumulativeShare: number;
}

export function topPayeesPareto(
  txs: NormalizedTransaction[],
  topN = 15
): PayeeParetoRow[] {
  const named = topNByOutflow(txs, (t) => t.payee, topN);
  const grand = named.reduce((a, x) => a + x.value, 0) || 1;
  let cum = 0;
  return named.map((x) => {
    const share = x.value / grand;
    cum += share;
    return { payee: x.name, total: x.value, share, cumulativeShare: cum };
  });
}

export interface RegisterMonthlyGroupPoint {
  monthKey: string;
  label: string;
  byGroup: Record<string, number>;
}

/** Sum outflows by category group per calendar month (Register only). */
export function aggregateRegisterOutflowByGroupMonthly(
  txs: NormalizedTransaction[]
): RegisterMonthlyGroupPoint[] {
  const map = new Map<string, Record<string, number>>();
  for (const t of txs) {
    const key = format(t.date, "yyyy-MM");
    const g = t.categoryGroup.trim() || "(Uncategorized)";
    if (!map.has(key)) map.set(key, {});
    const rec = map.get(key)!;
    rec[g] = (rec[g] ?? 0) + t.outflow;
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

/**
 * Radar: compare average monthly group outflow in `current` vs `baseline` txs.
 * Values indexed to 100 = baseline average. Keeps top `maxGroups` by combined outflow.
 */
export function radarGroupOutflowIndexed(
  baselineTxs: NormalizedTransaction[],
  currentTxs: NormalizedTransaction[],
  maxGroups = 12
): { groups: string[]; baseline: number[]; current: number[] } {
  const bDenom = Math.max(1, uniqueMonthCount(baselineTxs));
  const cDenom = Math.max(1, uniqueMonthCount(currentTxs));

  const baseSum = sumOutflowByGroup(baselineTxs);
  const curSum = sumOutflowByGroup(currentTxs);
  const union = [...new Set([...baseSum.keys(), ...curSum.keys()])];
  const scored = union
    .map((g) => ({
      g,
      score: (baseSum.get(g) ?? 0) + (curSum.get(g) ?? 0),
    }))
    .sort((a, b) => b.score - a.score);
  const groups = scored.slice(0, maxGroups).map((x) => x.g);

  const baselineAvg = groups.map((g) => (baseSum.get(g) ?? 0) / bDenom);
  const currentAvg = groups.map((g) => (curSum.get(g) ?? 0) / cDenom);

  const indexedCurrent = baselineAvg.map((b, i) => {
    if (b <= 0) return currentAvg[i] > 0 ? 100 : 0;
    return (currentAvg[i] / b) * 100;
  });
  const indexedBaseline = groups.map(() => 100);

  return { groups, baseline: indexedBaseline, current: indexedCurrent };
}

function uniqueMonthCount(txs: NormalizedTransaction[]): number {
  if (txs.length === 0) return 0;
  return new Set(txs.map((t) => format(t.date, "yyyy-MM"))).size;
}

function sumOutflowByGroup(txs: NormalizedTransaction[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of txs) {
    const g = t.categoryGroup.trim() || "(Uncategorized)";
    m.set(g, (m.get(g) ?? 0) + t.outflow);
  }
  return m;
}

/** Trailing N unique calendar months by transaction dates (for baseline window). */
export function filterTransactionsTrailingMonths(
  txs: NormalizedTransaction[],
  months: number
): NormalizedTransaction[] {
  if (txs.length === 0) return [];
  const sorted = [...txs].sort((a, b) => a.date.getTime() - b.date.getTime());
  const last = sorted[sorted.length - 1].date;
  const cutoff = new Date(last.getFullYear(), last.getMonth() - (months - 1), 1);
  return sorted.filter((t) => t.date >= cutoff);
}

/**
 * ECharts stacked-bar waterfall: transparent base + colored month net.
 * Returns categories, base series, net series, and line of cumulative end positions.
 */
export function waterfallSeriesFromMonthlyNet(monthly: MonthlyCashflowPoint[]): {
  categories: string[];
  base: number[];
  nets: number[];
  cumulativeEnd: number[];
} {
  const categories = monthly.map((p) => p.label);
  const base: number[] = [];
  const nets: number[] = [];
  const cumulativeEnd: number[] = [];
  let cum = 0;
  for (const p of monthly) {
    base.push(cum);
    nets.push(p.net);
    cum += p.net;
    cumulativeEnd.push(cum);
  }
  return { categories, base, nets, cumulativeEnd };
}

export function buildInflowSankey(txs: NormalizedTransaction[]): {
  nodes: { name: string }[];
  links: { source: string; target: string; value: number }[];
} {
  const groupTotals = new Map<string, number>();
  for (const t of txs) {
    const g = t.categoryGroup.trim() || "(Uncategorized)";
    groupTotals.set(g, (groupTotals.get(g) ?? 0) + t.inflow);
  }

  const entries = [...groupTotals.entries()].filter(([, v]) => v > 0);
  const nodes = [{ name: "Inflows" }, ...entries.map(([name]) => ({ name }))];
  const links = entries.map(([target, value]) => ({
    source: "Inflows",
    target,
    value,
  }));

  return { nodes, links };
}

