import {
  differenceInCalendarDays,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";
import type { Habit, HabitLog } from "./queries";

const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

export function findLogForDate(
  logs: HabitLog[],
  date: string,
): HabitLog | undefined {
  return logs.find((l) => l.date === date);
}

/**
 * Daily streak: consecutive days back from `today` where the log status is
 * "hit". Today itself counts only if logged as a hit; an unlogged today does
 * not break the streak that ended yesterday.
 */
export function dailyBuildStreak(logs: HabitLog[], today: Date): number {
  const byDate = new Map(logs.map((l) => [l.date, l]));
  let streak = 0;
  let cursor = today;
  const todayStr = isoDate(today);

  // If today isn't logged yet, start counting from yesterday so the streak
  // doesn't drop while the user is still mid-day.
  if (!byDate.has(todayStr)) {
    cursor = subDays(cursor, 1);
  }

  while (true) {
    const key = isoDate(cursor);
    const log = byDate.get(key);
    if (!log || log.status !== "hit") break;
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/**
 * Quit streak: days since the most recent miss, or since habit creation
 * if there's never been a miss.
 */
export function quitStreak(
  logs: HabitLog[],
  habit: Habit,
  today: Date,
): number {
  const misses = logs
    .filter((l) => l.status === "miss")
    .map((l) => parseISO(l.date))
    .sort((a, b) => b.getTime() - a.getTime());
  const last = misses[0] ?? parseISO(habit.created_at);
  return Math.max(0, differenceInCalendarDays(today, last));
}

/**
 * Build weekly progress: hits in the current ISO week (Mon-Sun).
 */
export function weeklyBuildHits(logs: HabitLog[], today: Date): number {
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = isoDate(weekStart);
  return logs.filter((l) => l.status === "hit" && l.date >= weekStartStr).length;
}

export function achieveTotal(logs: HabitLog[]): number {
  return logs.reduce((sum, l) => sum + (l.value ?? 0), 0);
}
