/**
 * Parse YNAB export currency strings like `$1,217.91`, `-$1571.54`, `$0.00`.
 */
export function parseMoney(raw: string): number {
  const s = raw.trim();
  if (!s) return 0;
  const negative = s.startsWith("-") || s.startsWith("(");
  const cleaned = s.replace(/[$(),]/g, "").replace(/\s/g, "");
  const n = Number.parseFloat(cleaned);
  if (Number.isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

/** Default for display only; amounts in CSVs stay as parsed numbers. */
export const DEFAULT_DISPLAY_CURRENCY = "AUD";

/** ISO 4217 codes offered in the UI (labels are English for consistency). */
export const DISPLAY_CURRENCY_OPTIONS: readonly {
  code: string;
  label: string;
}[] = [
  { code: "AUD", label: "Australian dollar (AUD)" },
  { code: "COP", label: "Colombian peso (COP)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British pound (GBP)" },
  { code: "NZD", label: "New Zealand dollar (NZD)" },
  { code: "CAD", label: "Canadian dollar (CAD)" },
  { code: "CNY", label: "Chinese yuan (CNY)" },
  { code: "USD", label: "US dollar (USD)" },
  { code: "JPY", label: "Japanese yen (JPY)" },
  { code: "INR", label: "Indian rupee (INR)" },
  { code: "BRL", label: "Brazilian real (BRL)" },
  { code: "MXN", label: "Mexican peso (MXN)" },
  { code: "SGD", label: "Singapore dollar (SGD)" },
  { code: "HKD", label: "Hong Kong dollar (HKD)" },
  { code: "KRW", label: "South Korean won (KRW)" },
  { code: "CHF", label: "Swiss franc (CHF)" },
  { code: "SEK", label: "Swedish krona (SEK)" },
  { code: "NOK", label: "Norwegian krone (NOK)" },
  { code: "DKK", label: "Danish krone (DKK)" },
  { code: "ZAR", label: "South African rand (ZAR)" },
] as const;

const formatterCache = new Map<string, Intl.NumberFormat>();

export type CurrencyFormatPreset = "table" | "chart";

export function getCurrencyFormatter(
  currency: string,
  preset: CurrencyFormatPreset
): Intl.NumberFormat {
  const key = `${currency}\0${preset}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    const opts: Intl.NumberFormatOptions =
      preset === "table"
        ? {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        : {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
          };
    fmt = new Intl.NumberFormat(undefined, opts);
    formatterCache.set(key, fmt);
  }
  return fmt;
}
