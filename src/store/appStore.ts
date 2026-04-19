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
import type { ChartId } from "@/lib/chartIds";
import type { DateRange } from "@/lib/aggregate";
import {
  buildChartDateRanges,
  defaultDateRangeForChart,
} from "@/lib/chartDateDefaults";
import { defaultFullRangeThroughLastCompleteMonth } from "@/lib/defaultMonthRange";
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
  /** Each chart has its own range (no global filter). */
  chartDateRanges: Record<ChartId, DateRange>;
  /** Register table uses its own range; default = start → last completed month. */
  transactionsDateRange: DateRange | null;
  selection: CategorySelection | null;
  /** ISO 4217 code for display formatting only. */
  displayCurrency: string;
  setFromFiles: (
    registerText: string,
    planText: string,
    options?: SetFromFilesOptions
  ) => void;
  setChartDateRange: (chartId: ChartId, range: DateRange | null) => void;
  setTransactionsDateRange: (range: DateRange | null) => void;
  setSelection: (s: CategorySelection | null) => void;
  setDisplayCurrency: (code: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  registerCsv: null,
  planCsv: null,
  dateFormat: null,
  transactions: [],
  planRows: [],
  loadError: null,
  lastLoadedAt: null,
  chartDateRanges: {} as Record<ChartId, DateRange>,
  transactionsDateRange: null,
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
        const chartDateRanges = buildChartDateRanges(transactions);
        const transactionsDateRange =
          defaultFullRangeThroughLastCompleteMonth(transactions);
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
          chartDateRanges,
          transactionsDateRange,
          selection: null,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to parse CSV";
        return { ...state, loadError: msg };
      }
    });
  },

  setChartDateRange: (chartId, range) =>
    set((state) => {
      const clearTreemapSelection =
        chartId === "treemap"
          ? { selection: null satisfies CategorySelection | null }
          : {};
      const txs = state.transactions;
      if (txs.length === 0) {
        return { ...clearTreemapSelection };
      }
      const nextRange = range ?? defaultDateRangeForChart(chartId, txs);
      if (!nextRange) {
        return { ...clearTreemapSelection };
      }
      return {
        chartDateRanges: {
          ...state.chartDateRanges,
          [chartId]: nextRange,
        },
        ...clearTreemapSelection,
      };
    }),

  setTransactionsDateRange: (range) =>
    set((state) => {
      const txs = state.transactions;
      if (txs.length === 0) {
        return { transactionsDateRange: null };
      }
      const next = range ?? defaultFullRangeThroughLastCompleteMonth(txs);
      return { transactionsDateRange: next };
    }),

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
      chartDateRanges: {} as Record<ChartId, DateRange>,
      transactionsDateRange: null,
      selection: null,
    });
  },
}));
