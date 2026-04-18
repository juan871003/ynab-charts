import type { CategorySelection, NormalizedTransaction } from "./types";
import { filterTransactions, type DateRange } from "./aggregate";

export function filterBySelection(
  txs: NormalizedTransaction[],
  sel: CategorySelection | null
): NormalizedTransaction[] {
  if (!sel) return txs;
  return txs.filter((t) => {
    if (sel.categoryGroup !== undefined && sel.categoryGroup !== null) {
      const g = t.categoryGroup.trim() || "(Uncategorized)";
      if (g !== sel.categoryGroup) return false;
    }
    if (sel.category !== undefined && sel.category !== null) {
      const c = t.category.trim() || "(Uncategorized)";
      if (c !== sel.category) return false;
    }
    return true;
  });
}

export function getVisibleTransactions(
  txs: NormalizedTransaction[],
  range: DateRange | null,
  sel: CategorySelection | null
): NormalizedTransaction[] {
  return filterBySelection(filterTransactions(txs, range), sel);
}
