import { useEffect } from "react";
import { format } from "date-fns";
import { ThemeToggle } from "./components/ThemeToggle";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
      </section>
    </main>
  );
}
