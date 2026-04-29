import { create } from "zustand";

type Theme = "dark" | "light";
export type Route = "home" | "habits" | "settings";

const THEME_KEY = "telos.theme";
const NN_OPEN_KEY = "telos.nonNegSidebarOpen";

const readInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
};

const readInitialNNOpen = (): boolean => {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage.getItem(NN_OPEN_KEY);
  if (stored === "false") return false;
  return true;
};

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  route: Route;
  setRoute: (route: Route) => void;

  nonNegSidebarOpen: boolean;
  toggleNonNegSidebar: () => void;
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

  nonNegSidebarOpen: readInitialNNOpen(),
  toggleNonNegSidebar: () => {
    const next = !get().nonNegSidebarOpen;
    window.localStorage.setItem(NN_OPEN_KEY, next ? "true" : "false");
    set({ nonNegSidebarOpen: next });
  },
}));
