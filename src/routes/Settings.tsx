import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, X } from "lucide-react";
import {
  addVerses,
  clearAllData,
  deleteVerse,
  exportData,
  listVerses,
} from "../lib/queries";
import { parseVerseLines } from "../lib/verses";
import { todayIsoDate } from "../lib/dates";
import { useAppStore, type Theme } from "../store/useAppStore";

export function Settings() {
  return (
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <h1 className="font-display text-xl text-text-primary">Settings</h1>

      <ThemeSection />
      <VersesSection />
      <DataSection />
    </main>
  );
}

// ---------- theme ----------

const THEME_OPTIONS: { value: Theme; label: string; description: string }[] = [
  { value: "dark", label: "Dark", description: "warm charcoal" },
  { value: "light", label: "Light", description: "cream paper" },
  { value: "system", label: "System", description: "follow OS preference" },
];

function ThemeSection() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  return (
    <section className="mt-12">
      <h2 className="font-display text-lg text-text-primary">Theme</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {THEME_OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={
                "rounded-sm border px-4 py-1.5 text-sm transition-colors duration-300 ease-soft " +
                (active
                  ? "border-accent bg-accent-soft text-text-primary"
                  : "border-border text-text-secondary hover:text-text-primary")
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 font-display italic text-xs text-text-tertiary">
        {THEME_OPTIONS.find((o) => o.value === theme)?.description}
      </p>
    </section>
  );
}

// ---------- verses ----------

function VersesSection() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const { data: verses = [] } = useQuery({
    queryKey: ["verses"],
    queryFn: listVerses,
  });

  const parsed = useMemo(() => parseVerseLines(draft), [draft]);

  const addMutation = useMutation({
    mutationFn: addVerses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verses"] });
      setDraft("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVerse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verses"] });
    },
  });

  return (
    <>
      <section className="mt-12">
        <h2 className="font-display text-lg text-text-primary">Verses</h2>
        <p className="mt-2 font-display italic text-sm text-text-tertiary">
          Paste verses one per line. Add a reference in brackets, e.g.{" "}
          <span className="not-italic">[Psalm 46:10]</span>.
        </p>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          placeholder={`Be still, and know that I am God. [Psalm 46:10]\nThe LORD is my shepherd; I shall not want. [Psalm 23:1]`}
          className="mt-4 w-full resize-y rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-text-tertiary">
            {parsed.length === 0
              ? "Nothing to add yet."
              : `${parsed.length} ${parsed.length === 1 ? "verse" : "verses"} ready to add.`}
          </p>
          <button
            type="button"
            disabled={parsed.length === 0 || addMutation.isPending}
            onClick={() => addMutation.mutate(parsed)}
            className="rounded-sm border border-accent bg-accent-soft px-4 py-1.5 text-sm text-text-primary transition-colors duration-300 ease-soft hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add verses
          </button>
        </div>
      </section>

      <section className="mt-12">
        <h3 className="text-xs uppercase tracking-wider text-text-tertiary">
          {verses.length === 0 ? "No verses yet" : `Saved · ${verses.length}`}
        </h3>

        {verses.length > 0 && (
          <ul className="mt-2">
            {verses.map((v) => (
              <li
                key={v.id}
                className="group flex items-start justify-between gap-4 border-b border-border px-2 py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-display italic text-sm text-text-primary">
                    {v.text}
                  </p>
                  {v.reference && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      {v.reference}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(v.id)}
                  aria-label="Delete verse"
                  title="Delete"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-text-tertiary opacity-60 transition-all duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary group-hover:opacity-100"
                >
                  <X strokeWidth={1.5} size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

// ---------- data ----------

function DataSection() {
  const queryClient = useQueryClient();
  const [exporting, setExporting] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current !== null) {
        window.clearTimeout(confirmTimer.current);
      }
    };
  }, []);

  const clearMutation = useMutation({
    mutationFn: clearAllData,
    onSuccess: () => {
      queryClient.invalidateQueries();
      setConfirmingClear(false);
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `telos-export-${todayIsoDate()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleClearClick = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      confirmTimer.current = window.setTimeout(() => {
        setConfirmingClear(false);
        confirmTimer.current = null;
      }, 5000);
      return;
    }
    if (confirmTimer.current !== null) {
      window.clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
    clearMutation.mutate();
  };

  return (
    <section className="mt-12">
      <h2 className="font-display text-lg text-text-primary">Data</h2>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-text-primary">Export as JSON</p>
            <p className="mt-1 text-xs text-text-tertiary">
              All habits, logs, non-negotiables, violations, and verses.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex shrink-0 items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary disabled:opacity-50"
          >
            <Download strokeWidth={1.5} size={16} />
            <span>{exporting ? "Exporting…" : "Export"}</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div>
            <p className="text-sm text-text-primary">Clear all data</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Removes habits, logs, non-negotiables, violations, and verses.
              This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearClick}
            disabled={clearMutation.isPending}
            className={
              "inline-flex shrink-0 items-center gap-2 rounded-sm border px-3 py-1.5 text-sm transition-colors duration-300 ease-soft disabled:opacity-50 " +
              (confirmingClear
                ? "border-transparent bg-danger-soft text-text-primary"
                : "border-border text-text-secondary hover:bg-bg-subtle hover:text-text-primary")
            }
          >
            <Trash2 strokeWidth={1.5} size={16} />
            <span>
              {clearMutation.isPending
                ? "Clearing…"
                : confirmingClear
                  ? "Tap again to confirm"
                  : "Clear"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
