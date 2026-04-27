import { Home, ListChecks, Settings } from "lucide-react";
import { useAppStore, type Route } from "../store/useAppStore";

interface NavItem {
  id: Route;
  label: string;
  icon: typeof Home;
}

const NAV: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const route = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-bg-elevated px-4 py-6">
      <h2 className="px-2 font-display text-lg italic text-text-primary">Telos</h2>

      <nav className="mt-10 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoute(item.id)}
              className={
                "flex items-center gap-3 rounded-sm px-2 py-2 text-left text-sm transition-colors duration-300 ease-soft " +
                (active
                  ? "bg-bg-subtle text-text-primary"
                  : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary")
              }
            >
              <Icon strokeWidth={1.5} size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
