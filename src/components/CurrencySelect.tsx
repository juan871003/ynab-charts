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
        color: "#9aa5b1",
        fontSize: "0.9rem",
      }}
    >
      <span>Currency</span>
      <select
        value={displayCurrency}
        onChange={(e) => setDisplayCurrency(e.target.value)}
        style={{
          padding: "0.35rem 0.5rem",
          background: "#1e2835",
          border: "1px solid #3d4d60",
          borderRadius: 6,
          color: "#e8eaed",
          fontSize: "0.9rem",
          maxWidth: "min(100%, 22rem)",
        }}
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
