import { useEffect } from "react";
import { NonNegotiablesSidebar } from "./components/NonNegotiablesSidebar";
import { Sidebar } from "./components/Sidebar";
import { VerseWidget } from "./components/VerseWidget";
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
      <NonNegotiablesSidebar />

      <div className="relative flex-1 overflow-hidden">
        <VerseWidget />

        <div className="h-full overflow-y-auto pr-72">
          {route === "home" && <Home />}
          {route === "habits" && <Habits />}
          {route === "settings" && <Settings />}
        </div>
      </div>
    </div>
  );
}
