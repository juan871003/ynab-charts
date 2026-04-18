const STORAGE_KEY = "ynab-charts:v1";

export type PersistedPayload = {
  v: 1;
  registerCsv: string;
  planCsv: string;
  /** ISO 8601 — time the user last successfully parsed files (manual load or restore). */
  lastLoadedAt: string;
};

export function loadPersisted(): PersistedPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== 1) return null;
    if (
      typeof o.registerCsv !== "string" ||
      typeof o.planCsv !== "string" ||
      typeof o.lastLoadedAt !== "string"
    ) {
      return null;
    }
    return {
      v: 1,
      registerCsv: o.registerCsv,
      planCsv: o.planCsv,
      lastLoadedAt: o.lastLoadedAt,
    };
  } catch {
    return null;
  }
}

export function savePersisted(payload: PersistedPayload): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersisted(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
