import { Moon, Sun } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
    >
      {isDark ? <Sun strokeWidth={1.5} size={20} /> : <Moon strokeWidth={1.5} size={20} />}
    </button>
  );
}
