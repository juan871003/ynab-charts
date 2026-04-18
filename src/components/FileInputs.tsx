import { useCallback, useRef } from "react";
import { useAppStore } from "@/store/appStore";

export function FileInputs() {
  const setFromFiles = useAppStore((s) => s.setFromFiles);
  const loadError = useAppStore((s) => s.loadError);
  const regRef = useRef<HTMLInputElement>(null);
  const planRef = useRef<HTMLInputElement>(null);

  const onLoad = useCallback(async () => {
    const regFile = regRef.current?.files?.[0];
    const planFile = planRef.current?.files?.[0];
    if (!regFile || !planFile) return;
    const [registerText, planText] = await Promise.all([
      regFile.text(),
      planFile.text(),
    ]);
    setFromFiles(registerText, planText);
  }, [setFromFiles]);

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
        Choose the <strong>Plan</strong> and <strong>Register</strong> CSV files
        from <em>Export Plan</em> in the YNAB web app. Files are parsed in your
        browser only—nothing is uploaded to a server.
      </p>
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
            Plan CSV
          </span>
          <input ref={planRef} type="file" accept=".csv,.tsv,text/csv" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "0.85rem", color: "#9aa5b1" }}>
            Register CSV
          </span>
          <input ref={regRef} type="file" accept=".csv,.tsv,text/csv" />
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
      </div>
      {loadError ? (
        <p style={{ color: "#f88", marginTop: "0.75rem" }} role="alert">
          {loadError}
        </p>
      ) : null}
    </section>
  );
}
