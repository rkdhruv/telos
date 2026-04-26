import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ThemeToggle } from "./components/ThemeToggle";
import { useAppStore } from "./store/useAppStore";
import { listHabits, listNonNegotiables, listVerses } from "./lib/queries";

interface SeedCounts {
  habits: number;
  verses: number;
  nonNegotiables: number;
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const [counts, setCounts] = useState<SeedCounts | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [habits, verses, nonNegotiables] = await Promise.all([
          listHabits(),
          listVerses(),
          listNonNegotiables(),
        ]);
        if (!cancelled) {
          setCounts({
            habits: habits.length,
            verses: verses.length,
            nonNegotiables: nonNegotiables.length,
          });
        }
      } catch {
        // No DB outside the Tauri runtime — leave counts unset.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <main className="min-h-full px-10 py-12">
      <header className="flex items-start justify-between">
        <p className="font-display italic text-sm text-text-secondary">{today}</p>
        <ThemeToggle />
      </header>

      <section className="mt-24 max-w-xl">
        <h1 className="font-display text-2xl text-text-primary">Telos</h1>
        <p className="mt-4 font-display italic text-base text-text-secondary">
          A quiet space for the practices that shape a life.
        </p>
        {counts && (
          <p className="mt-6 text-xs text-text-tertiary">
            {counts.habits} habits · {counts.verses} verses · {counts.nonNegotiables} non-negotiables
          </p>
        )}
      </section>
    </main>
  );
}
