import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { HabitRow } from "../components/HabitRow";
import { listHabits } from "../lib/queries";
import { useAppStore } from "../store/useAppStore";

export function Home() {
  const setRoute = useAppStore((s) => s.setRoute);
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: listHabits,
  });

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <main className="mx-auto w-full max-w-3xl px-10 py-12">
      <p className="font-display italic text-sm text-text-secondary">{today}</p>

      <section className="mt-12">
        {isLoading ? (
          <p className="font-display italic text-sm text-text-tertiary">
            Loading…
          </p>
        ) : habits.length === 0 ? (
          <div className="mt-12 max-w-lg">
            <p className="font-display italic text-base text-text-secondary">
              A quiet space for the practices that shape a life.
            </p>
            <button
              type="button"
              onClick={() => setRoute("habits")}
              className="mt-6 text-sm text-text-secondary underline-offset-4 transition-colors duration-300 ease-soft hover:text-text-primary hover:underline"
            >
              Add your first habit →
            </button>
          </div>
        ) : (
          <ul>
            {habits.map((h) => (
              <HabitRow key={h.id} habit={h} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
