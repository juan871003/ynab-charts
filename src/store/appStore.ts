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
import { DEFAULT_DISPLAY_CURRENCY } from "@/lib/money";
import {
  clearPersisted,
  savePersisted,
  type PersistedPayload,
} from "@/lib/persistedData";

export type { CategorySelection };

export type SetFromFilesOptions = {
  /** Defaults to now. Use when hydrating from localStorage. */
  loadedAt?: string;
  /** Set false when restoring from disk so we do not rewrite storage. Default true. */
  persist?: boolean;
};

interface AppState {
  registerCsv: string | null;
  planCsv: string | null;
  dateFormat: InferredDateFormat | null;
  transactions: NormalizedTransaction[];
  planRows: PlanRow[];
  loadError: string | null;
  /** ISO 8601 — last successful manual parse (or restored session time). */
  lastLoadedAt: string | null;
  dateRange: DateRange | null;
  selection: CategorySelection | null;
  /** ISO 4217 code for display formatting only. */
  displayCurrency: string;
  setFromFiles: (
    registerText: string,
    planText: string,
    options?: SetFromFilesOptions
  ) => void;
  setDateRange: (range: DateRange | null) => void;
  setSelection: (s: CategorySelection | null) => void;
  setDisplayCurrency: (code: string) => void;
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
  lastLoadedAt: null,
  dateRange: null,
  selection: null,
  displayCurrency: DEFAULT_DISPLAY_CURRENCY,

  setFromFiles: (registerText, planText, options) => {
    const persist = options?.persist !== false;
    const loadedAt = options?.loadedAt ?? new Date().toISOString();
    set((state) => {
      try {
        const dates = extractRegisterDateStrings(registerText);
        const fmt = inferDateFormatFromSamples(dates);
        const transactions = parseRegisterCsv(registerText, fmt);
        const planRows = parsePlanCsv(planText);
        const dateRange = computeDefaultRange(transactions);
        if (persist) {
          const payload: PersistedPayload = {
            v: 1,
            registerCsv: registerText,
            planCsv: planText,
            lastLoadedAt: loadedAt,
          };
          try {
            savePersisted(payload);
          } catch (e) {
            const msg =
              e instanceof Error
                ? e.message
                : "Could not save to browser storage (file too large?)";
            return { ...state, loadError: msg };
          }
        }
        return {
          ...state,
          registerCsv: registerText,
          planCsv: planText,
          dateFormat: fmt,
          transactions,
          planRows,
          loadError: null,
          lastLoadedAt: loadedAt,
          dateRange,
          selection: null,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to parse CSV";
        return { ...state, loadError: msg };
      }
    });
  },

  setDateRange: (range) => set({ dateRange: range }),

  setSelection: (s) => set({ selection: s }),

  setDisplayCurrency: (code) => set({ displayCurrency: code }),

  reset: () => {
    clearPersisted();
    set({
      registerCsv: null,
      planCsv: null,
      dateFormat: null,
      transactions: [],
      planRows: [],
      loadError: null,
      lastLoadedAt: null,
      dateRange: null,
      selection: null,
    });
  },
}));
