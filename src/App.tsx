import { useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ThemeToggle } from "./components/ThemeToggle";
import { Habits } from "./routes/Habits";
import { Home } from "./routes/Home";
import { Settings } from "./routes/Settings";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const route = useAppStore((s) => s.route);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex h-full">
      <Sidebar />

      <div className="relative flex-1 overflow-y-auto">
        <div className="absolute right-6 top-6 z-10">
          <ThemeToggle />
        </div>

        {route === "home" && <Home />}
        {route === "habits" && <Habits />}
        {route === "settings" && <Settings />}
      </div>
    </div>
  );
}
