import { useCallback, useRef, useState } from "react";
import { detectCsvKind } from "@/lib/csvKind";
import { useAppStore } from "@/store/appStore";

function formatLoadedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function FileInputs() {
  const setFromFiles = useAppStore((s) => s.setFromFiles);
  const loadError = useAppStore((s) => s.loadError);
  const lastLoadedAt = useAppStore((s) => s.lastLoadedAt);
  const hasData = useAppStore((s) => s.transactions.length > 0);
  const reset = useAppStore((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  const onLoad = useCallback(async () => {
    const fileList = fileRef.current?.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList);

    const classified: {
      text: string;
      kind: "register" | "plan";
      name: string;
    }[] = [];
    const unrecognized: string[] = [];

    for (const f of files) {
      const text = await f.text();
      const kind = detectCsvKind(text);
      if (!kind) {
        unrecognized.push(f.name);
        continue;
      }
      classified.push({ text, kind, name: f.name });
    }

    const registers = classified.filter((c) => c.kind === "register");
    const plans = classified.filter((c) => c.kind === "plan");

    if (registers.length !== 1 || plans.length !== 1) {
      const parts: string[] = [
        "Need exactly one Register export and one Plan export.",
      ];
      if (unrecognized.length) {
        parts.push(
          `Unrecognized (${unrecognized.join(
            ", "
          )}). Expected YNAB header columns.`
        );
      }
      if (registers.length !== 1) {
        parts.push(`Register files: ${registers.length}.`);
      }
      if (plans.length !== 1) {
        parts.push(`Plan files: ${plans.length}.`);
      }
      setPickError(parts.join(" "));
      return;
    }

    setPickError(null);
    setFromFiles(registers[0].text, plans[0].text);
  }, [setFromFiles]);

  const alertText = pickError ?? loadError;

  return (
    <section
      style={{
        padding: "1rem 1.25rem",
        background: "var(--ynab-bg-elevated)",
        borderRadius: 10,
        border: "1px solid var(--ynab-border)",
      }}
    >
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
        Load YNAB export
      </h2>
      <p
        style={{
          margin: "0 0 1rem",
          color: "var(--ynab-text-muted)",
          fontSize: "0.9rem",
        }}
      >
        Select your <strong>Plan</strong> and <strong>Register</strong> CSVs
        from <em>Export Plan</em> in the YNAB web app (one or more files—we
        detect which is which from the columns). Data is parsed in your browser
        only and can be saved locally so you do not have to reload after a
        refresh.
      </p>
      {lastLoadedAt ? (
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: "0.9rem",
            color: "var(--ynab-text-dim)",
          }}
        >
          Last loaded:{" "}
          <time dateTime={lastLoadedAt} style={{ color: "var(--ynab-code)" }}>
            {formatLoadedAt(lastLoadedAt)}
          </time>
        </p>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.85rem", color: "var(--ynab-text-dim)" }}>
            Plan &amp; Register CSVs
          </span>
          <input
            ref={fileRef}
            className="ynab-file-input"
            type="file"
            accept=".csv,.tsv,text/csv"
            multiple
          />
        </label>
        <button
          type="button"
          className="ynab-btn ynab-btn--primary"
          onClick={() => void onLoad()}
        >
          Parse files
        </button>
        {hasData ? (
          <button
            type="button"
            className="ynab-btn ynab-btn--secondary"
            onClick={() => {
              setPickError(null);
              reset();
            }}
          >
            Clear saved data
          </button>
        ) : null}
      </div>
      {alertText ? (
        <p
          style={{ color: "var(--ynab-error)", marginTop: "0.75rem" }}
          role="alert"
        >
          {alertText}
        </p>
      ) : null}
    </section>
  );
}
