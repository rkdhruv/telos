import { useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";
import type { Habit, HabitLog } from "../lib/queries";
import { bestQuitStreak, quitStreak } from "../lib/streaks";
import { GraphCard } from "./GraphChrome";

interface Props {
  habit: Habit;
  logs: HabitLog[];
}

interface Cell {
  date: string;
  status: "clean" | "miss" | "unlogged" | "future";
  label: string;
}

export function QuitGraph({ habit, logs }: Props) {
  const today = useMemo(() => new Date(), []);
  const current = quitStreak(logs, habit, today);
  const best = bestQuitStreak(logs, habit, today);

  const grid = useMemo(() => buildHeatmapGrid(habit, logs, today), [habit, logs, today]);

  return (
    <GraphCard>
      {current === 0 ? (
        <p className="font-display italic text-lg text-text-secondary">Day one.</p>
      ) : (
        <div className="flex items-baseline gap-3">
          <p className="font-display text-2xl text-text-primary">{current}</p>
          <p className="text-sm text-text-secondary">
            {current === 1 ? "day clean" : "days clean"}
          </p>
        </div>
      )}
      {best > 0 && (
        <p className="mt-1 text-xs text-text-tertiary">best: {best}</p>
      )}

      <div className="mt-6 overflow-x-auto">
        <Heatmap grid={grid} />
      </div>
    </GraphCard>
  );
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function Heatmap({ grid }: { grid: Cell[][] }) {
  const [hover, setHover] = useState<Cell | null>(null);

  return (
    <div>
      <div className="flex gap-1">
        <div className="flex w-7 flex-col gap-1 pr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex h-3 items-center text-[10px] text-text-tertiary"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {grid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((cell, dIdx) => (
                <Square
                  key={dIdx}
                  cell={cell}
                  onHover={setHover}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 h-4 text-xs text-text-tertiary">
        {hover ? `${hover.label} · ${labelStatus(hover.status)}` : ""}
      </div>
    </div>
  );
}

function Square({
  cell,
  onHover,
}: {
  cell: Cell;
  onHover: (c: Cell | null) => void;
}) {
  const cls = (() => {
    switch (cell.status) {
      case "clean":
        return "bg-accent";
      case "miss":
        return "bg-danger-soft";
      case "future":
        return "bg-transparent";
      default:
        return "bg-bg-subtle";
    }
  })();

  return (
    <div
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      className={"h-3 w-3 rounded-[2px] transition-colors duration-300 ease-soft " + cls}
    />
  );
}

function labelStatus(status: Cell["status"]): string {
  switch (status) {
    case "clean":
      return "clean";
    case "miss":
      return "missed";
    case "unlogged":
      return "unlogged";
    case "future":
      return "";
  }
}

function buildHeatmapGrid(
  habit: Habit,
  logs: HabitLog[],
  today: Date,
): Cell[][] {
  const start = parseISO(habit.created_at);
  const gridStart = startOfWeek(start, { weekStartsOn: 1 });
  const totalDays = differenceInCalendarDays(today, gridStart) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const byDate = new Map(logs.map((l) => [l.date, l]));
  const startDateStr = format(start, "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  const grid: Cell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(gridStart, w * 7 + d);
      const key = format(date, "yyyy-MM-dd");
      const label = format(date, "MMM d, yyyy");
      let status: Cell["status"];
      if (key < startDateStr || key > todayStr) {
        status = "future";
      } else {
        const log = byDate.get(key);
        if (!log) status = "unlogged";
        else if (log.status === "miss") status = "miss";
        else status = "clean";
      }
      week.push({ date: key, status, label });
    }
    grid.push(week);
  }
  return grid;
}
