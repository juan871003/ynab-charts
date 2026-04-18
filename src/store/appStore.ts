import { create } from "zustand";
import {
  inferDateFormatFromSamples,
  type InferredDateFormat,
} from "@/lib/dateInference";
import { parsePlanCsv } from "@/lib/plan";
import { extractRegisterDateStrings, parseRegisterCsv } from "@/lib/register";
import type {
  CategorySelection,
  NormalizedTransaction,
  PlanRow,
} from "@/lib/types";
import type { DateRange } from "@/lib/aggregate";

export type { CategorySelection };

interface AppState {
  registerCsv: string | null;
  planCsv: string | null;
  dateFormat: InferredDateFormat | null;
  transactions: NormalizedTransaction[];
  planRows: PlanRow[];
  loadError: string | null;
  dateRange: DateRange | null;
  selection: CategorySelection | null;
  setFromFiles: (registerText: string, planText: string) => void;
  setDateRange: (range: DateRange | null) => void;
  setSelection: (s: CategorySelection | null) => void;
  reset: () => void;
}

function computeDefaultRange(txs: NormalizedTransaction[]): DateRange | null {
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

export const useAppStore = create<AppState>((set) => ({
  registerCsv: null,
  planCsv: null,
  dateFormat: null,
  transactions: [],
  planRows: [],
  loadError: null,
  dateRange: null,
  selection: null,

  setFromFiles: (registerText, planText) => {
    try {
      const dates = extractRegisterDateStrings(registerText);
      const fmt = inferDateFormatFromSamples(dates);
      const transactions = parseRegisterCsv(registerText, fmt);
      const planRows = parsePlanCsv(planText);
      const dateRange = computeDefaultRange(transactions);
      set({
        registerCsv: registerText,
        planCsv: planText,
        dateFormat: fmt,
        transactions,
        planRows,
        loadError: null,
        dateRange,
        selection: null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to parse CSV";
      set({
        loadError: msg,
        registerCsv: null,
        planCsv: null,
        dateFormat: null,
        transactions: [],
        planRows: [],
        dateRange: null,
        selection: null,
      });
    }
  },

  setDateRange: (range) => set({ dateRange: range }),

  setSelection: (s) => set({ selection: s }),

  reset: () =>
    set({
      registerCsv: null,
      planCsv: null,
      dateFormat: null,
      transactions: [],
      planRows: [],
      loadError: null,
      dateRange: null,
      selection: null,
    }),
}));
