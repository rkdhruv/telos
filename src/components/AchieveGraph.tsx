import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
} from "date-fns";
import type { Habit, HabitLog } from "../lib/queries";
import { achieveCatchup } from "../lib/catchup";
import { GraphCard, GraphTooltip, ProjectionToggle } from "./GraphChrome";

interface Props {
  habit: Habit;
  logs: HabitLog[];
}

const BAND = 0.1;

const rolling14DayValueRate = (logs: HabitLog[], today: Date): number => {
  const fourteenDaysAgo = addDays(today, -13);
  const cutoff = format(fourteenDaysAgo, "yyyy-MM-dd");
  const sum = logs
    .filter((l) => l.date >= cutoff)
    .reduce((acc, l) => acc + (l.value ?? 0), 0);
  return sum / 14;
};

export function AchieveGraph({ habit, logs }: Props) {
  const [mode, setMode] = useState<"linear" | "trend">("linear");
  const today = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    if (!habit.deadline || !habit.target_value) return [];
    const start = parseISO(habit.created_at);
    const deadline = parseISO(habit.deadline);
    const totalDays = Math.max(1, differenceInCalendarDays(deadline, start));
    const elapsed = Math.max(0, differenceInCalendarDays(today, start));
    const horizon = Math.min(totalDays, elapsed) + 1;

    const valueByDate = new Map<string, number>();
    for (const l of logs) {
      valueByDate.set(l.date, (valueByDate.get(l.date) ?? 0) + (l.value ?? 0));
    }

    const trendRate = rolling14DayValueRate(logs, today);
    const linearRate = habit.target_value / totalDays;
    const slope = mode === "trend" ? trendRate : linearRate;

    let cumulativeReality = 0;
    const points = [];
    for (let i = 0; i < horizon; i++) {
      const d = addDays(start, i);
      const key = format(d, "yyyy-MM-dd");
      cumulativeReality += valueByDate.get(key) ?? 0;
      const expected = slope * i;
      points.push({
        day: i,
        date: key,
        label: format(d, "MMM d"),
        expected,
        reality: cumulativeReality,
        band: [expected * (1 - BAND), expected * (1 + BAND)] as [number, number],
      });
    }
    return points;
  }, [habit, logs, mode, today]);

  const catchup = achieveCatchup(logs, habit, today);
  const unit = habit.target_unit ?? "";

  return (
    <GraphCard
      toolbar={
        <ProjectionToggle
          value={mode}
          options={[
            { value: "linear", label: "Linear projection" },
            { value: "trend", label: "Trend projection" },
          ]}
          onChange={setMode}
        />
      }
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="2 2"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis
              tick={{ fill: "var(--text-tertiary)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip content={<GraphTooltip unit={unit} />} />
            <Area
              type="monotone"
              dataKey="band"
              fill="var(--accent-soft)"
              stroke="none"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="expected"
              stroke="var(--text-secondary)"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="reality"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "var(--accent)", stroke: "none" }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {catchup !== null && (
        <p className="mt-4 font-display italic text-sm text-text-secondary">
          {catchup.perDay} more {unit} per day to hit your deadline.
        </p>
      )}
    </GraphCard>
  );
}
