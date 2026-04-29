import { Laptop, Moon, Sun } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const cycleTheme = useAppStore((s) => s.cycleTheme);

  const Icon = theme === "dark" ? Sun : theme === "light" ? Moon : Laptop;
  const label =
    theme === "dark"
      ? "Theme: dark — switch to light"
      : theme === "light"
        ? "Theme: light — switch to system"
        : "Theme: system — switch to dark";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
    >
      <Icon strokeWidth={1.5} size={20} />
    </button>
  );
}
