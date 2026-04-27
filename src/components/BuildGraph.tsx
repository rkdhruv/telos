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
import { buildCatchupDays } from "../lib/catchup";
import { GraphCard, GraphTooltip, ProjectionToggle } from "./GraphChrome";

interface Props {
  habit: Habit;
  logs: HabitLog[];
}

const BAND = 0.1;

const targetPerDay = (habit: Habit): number => {
  if (habit.cadence === "weekly" && habit.weekly_target) {
    return habit.weekly_target / 7;
  }
  return 1;
};

const rolling14DayRate = (logs: HabitLog[], today: Date): number => {
  const fourteenDaysAgo = addDays(today, -13);
  const cutoff = format(fourteenDaysAgo, "yyyy-MM-dd");
  const recentHits = logs.filter(
    (l) => l.status === "hit" && l.date >= cutoff,
  ).length;
  return recentHits / 14;
};

export function BuildGraph({ habit, logs }: Props) {
  const [mode, setMode] = useState<"linear" | "trend">("linear");
  const today = useMemo(() => new Date(), []);

  const data = useMemo(() => {
    const start = parseISO(habit.created_at);
    const days = Math.max(1, differenceInCalendarDays(today, start)) + 1;
    const perDay = targetPerDay(habit);
    const trendRate = rolling14DayRate(logs, today);
    const slope = mode === "trend" ? trendRate : perDay;

    const hitsByDate = new Map<string, number>();
    for (const l of logs) {
      if (l.status === "hit") {
        hitsByDate.set(l.date, (hitsByDate.get(l.date) ?? 0) + 1);
      }
    }

    let cumulativeReality = 0;
    const points: {
      day: number;
      date: string;
      label: string;
      expected: number;
      reality: number;
      band: [number, number];
    }[] = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      const key = format(d, "yyyy-MM-dd");
      cumulativeReality += hitsByDate.get(key) ?? 0;
      const expected = slope * (i + 1);
      points.push({
        day: i,
        date: key,
        label: format(d, "MMM d"),
        expected,
        reality: cumulativeReality,
        band: [expected * (1 - BAND), expected * (1 + BAND)],
      });
    }
    return points;
  }, [habit, logs, mode, today]);

  const catchup = buildCatchupDays(logs, habit, today);

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
              width={32}
            />
            <Tooltip content={<GraphTooltip unit="hits" />} />
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
          Hit the next {catchup} {catchup === 1 ? "day" : "days"} to get back on pace.
        </p>
      )}
    </GraphCard>
  );
}
