import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  listHabits,
  listNonNegotiables,
  listVerses,
} from "../lib/queries";

export function Home() {
  const habits = useQuery({ queryKey: ["habits"], queryFn: listHabits });
  const verses = useQuery({ queryKey: ["verses"], queryFn: listVerses });
  const nonNegotiables = useQuery({
    queryKey: ["non-negotiables"],
    queryFn: listNonNegotiables,
  });

  const today = format(new Date(), "EEEE, MMMM d");

  const ready =
    habits.data && verses.data && nonNegotiables.data
      ? {
          habits: habits.data.length,
          verses: verses.data.length,
          nonNegotiables: nonNegotiables.data.length,
        }
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <p className="font-display italic text-sm text-text-secondary">{today}</p>

      <section className="mt-24 max-w-xl">
        <h1 className="font-display text-2xl text-text-primary">Telos</h1>
        <p className="mt-4 font-display italic text-base text-text-secondary">
          A quiet space for the practices that shape a life.
        </p>
        {ready && (
          <p className="mt-6 text-xs text-text-tertiary">
            {ready.habits} habits · {ready.verses} verses · {ready.nonNegotiables} non-negotiables
          </p>
        )}
      </section>
    </main>
  );
}
