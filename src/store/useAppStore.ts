import { create } from "zustand";

type Theme = "dark" | "light";
export type Route = "home" | "habits" | "settings";

const THEME_KEY = "telos.theme";

const readInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
};

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  route: Route;
  setRoute: (route: Route) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    window.localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  route: "home",
  setRoute: (route) => set({ route }),
}));
