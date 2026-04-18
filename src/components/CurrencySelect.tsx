import { DISPLAY_CURRENCY_OPTIONS } from "@/lib/money";
import { useAppStore } from "@/store/appStore";

export function CurrencySelect() {
  const displayCurrency = useAppStore((s) => s.displayCurrency);
  const setDisplayCurrency = useAppStore((s) => s.setDisplayCurrency);

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "var(--ynab-text-dim)",
        fontSize: "0.9rem",
      }}
    >
      <span>Currency</span>
      <select
        className="ynab-select"
        value={displayCurrency}
        onChange={(e) => setDisplayCurrency(e.target.value)}
      >
        {DISPLAY_CURRENCY_OPTIONS.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
