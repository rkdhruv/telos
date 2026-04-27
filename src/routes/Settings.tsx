import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { addVerses, deleteVerse, listVerses } from "../lib/queries";
import { parseVerseLines } from "../lib/verses";

export function Settings() {
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
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <h1 className="font-display text-xl text-text-primary">Settings</h1>

      <section className="mt-12">
        <h2 className="font-display text-lg text-text-primary">Verses</h2>
        <p className="mt-2 font-display italic text-sm text-text-tertiary">
          Paste verses one per line. Add a reference in brackets, e.g. <span className="not-italic">[Psalm 46:10]</span>.
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
          {verses.length === 0
            ? "No verses yet"
            : `Saved · ${verses.length}`}
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
    </main>
  );
}
