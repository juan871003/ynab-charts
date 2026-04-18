/**
 * YNAB-inspired dark palette (aligned with app UI and chart defaults).
 * ECharts options cannot read CSS variables reliably; keep literals in sync with index.css.
 */
export const ui = {
  textPrimary: "#f0f0f5",
  textMuted: "#b5b5c8",
  textDim: "#9898ac",
  axisLabel: "#b5b5c8",
  title: "#c8c8d8",
  splitLine: "#2a2a3c",
  border: "#2e2e42",
  panelBg: "#1a1a26",
  pageBg: "#12121c",
  accent: "#29ce7d",
  link: "#5dd4a8",
  code: "#8fd4bc",
  error: "#ff8a8a",
} as const;

/** Category / series colors (donut-like, high contrast on dark bg). */
export const chartPalette = [
  "#4a8fe8",
  "#c8e65c",
  "#f2c14e",
  "#e95858",
  "#9eb4f0",
  "#f28c4a",
  "#e070c8",
  "#b8a8e8",
  "#5cd4b8",
  "#e8a45c",
] as const;
