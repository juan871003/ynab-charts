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
        background: "#1a2332",
        borderRadius: 8,
        border: "1px solid #2a3544",
      }}
    >
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem" }}>
        Load YNAB export
      </h2>
      <p style={{ margin: "0 0 1rem", color: "#b8c0cc", fontSize: "0.9rem" }}>
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
            color: "#9aa5b1",
          }}
        >
          Last loaded:{" "}
          <time dateTime={lastLoadedAt} style={{ color: "#c8e0ff" }}>
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
          <span style={{ fontSize: "0.85rem", color: "#9aa5b1" }}>
            Plan &amp; Register CSVs
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,text/csv"
            multiple
          />
        </label>
        <button
          type="button"
          onClick={() => void onLoad()}
          style={{
            padding: "0.5rem 1rem",
            background: "#3d6fb8",
            border: "none",
            borderRadius: 6,
            color: "#fff",
          }}
        >
          Parse files
        </button>
        {hasData ? (
          <button
            type="button"
            onClick={() => {
              setPickError(null);
              reset();
            }}
            style={{
              padding: "0.5rem 1rem",
              background: "#2a3544",
              border: "1px solid #3d4d60",
              borderRadius: 6,
              color: "#e8eaed",
            }}
          >
            Clear saved data
          </button>
        ) : null}
      </div>
      {alertText ? (
        <p style={{ color: "#f88", marginTop: "0.75rem" }} role="alert">
          {alertText}
        </p>
      ) : null}
    </section>
  );
}
