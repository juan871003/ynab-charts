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
