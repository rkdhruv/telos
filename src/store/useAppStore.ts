import { create } from "zustand";

export type Theme = "dark" | "light" | "system";
export type EffectiveTheme = "dark" | "light";
export type Route = "home" | "habits" | "settings";

const THEME_KEY = "telos.theme";
const NN_OPEN_KEY = "telos.nonNegSidebarOpen";

const readInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "dark";
};

const readInitialNNOpen = (): boolean => {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(NN_OPEN_KEY);
  if (stored === "false") return false;
  return true;
};

export const systemPrefersDark = (): boolean => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export const resolveTheme = (theme: Theme): EffectiveTheme =>
  theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;

  route: Route;
  setRoute: (route: Route) => void;

  nonNegSidebarOpen: boolean;
  toggleNonNegSidebar: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    window.localStorage.setItem(THEME_KEY, theme);
    set({ theme });
  },
  cycleTheme: () => {
    const current = get().theme;
    const next: Theme =
      current === "dark" ? "light" : current === "light" ? "system" : "dark";
    get().setTheme(next);
  },

  route: "home",
  setRoute: (route) => set({ route }),

  nonNegSidebarOpen: readInitialNNOpen(),
  toggleNonNegSidebar: () => {
    const next = !get().nonNegSidebarOpen;
    window.localStorage.setItem(NN_OPEN_KEY, next ? "true" : "false");
    set({ nonNegSidebarOpen: next });
  },
}));
