import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Habit, HabitLog } from "./queries";
import { achieveTotal } from "./streaks";

const BAND = 0.1; // ±10% on-pace band

const targetPerDay = (habit: Habit): number => {
  if (habit.type !== "build") return 0;
  if (habit.cadence === "weekly" && habit.weekly_target) {
    return habit.weekly_target / 7;
  }
  return 1; // daily
};

/**
 * For a build habit currently below the on-pace band, return the number of
 * consecutive future hits required to bring the user back into the band.
 * Returns null when the user is already in or above the band, or when the
 * math doesn't converge in a reasonable horizon (e.g. daily habit deeply
 * behind — recovery is structurally slow and a number would mislead).
 */
export function buildCatchupDays(
  logs: HabitLog[],
  habit: Habit,
  today: Date,
): number | null {
  if (habit.type !== "build") return null;
  const start = parseISO(habit.created_at);
  const daysElapsed = Math.max(1, differenceInCalendarDays(today, start) + 1);
  const perDay = targetPerDay(habit);
  if (perDay <= 0) return null;

  const expectedToday = perDay * daysElapsed;
  const bandLow = expectedToday * (1 - BAND);
  const hitsToDate = logs.filter((l) => l.status === "hit").length;

  if (hitsToDate >= bandLow) return null;

  // Solve: hits + n >= perDay * (1 - BAND) * (daysElapsed + n)
  const denom = 1 - perDay * (1 - BAND);
  if (denom <= 0) return null; // no convergence (rare, near-impossible for sensible inputs)

  const n = (perDay * (1 - BAND) * daysElapsed - hitsToDate) / denom;
  if (!Number.isFinite(n) || n <= 0) return null;
  const rounded = Math.ceil(n);
  if (rounded > 60) return null; // beyond a reasonable horizon — say nothing
  return rounded;
}

export interface AchieveCatchup {
  perDay: number;
  unit: string;
  daysRemaining: number;
}

/**
 * For an achieve habit currently below the on-pace band, return how much
 * per remaining day is needed to land on target by the deadline. Returns
 * null when on or above pace, or when the deadline has passed.
 */
export function achieveCatchup(
  logs: HabitLog[],
  habit: Habit,
  today: Date,
): AchieveCatchup | null {
  if (
    habit.type !== "achieve" ||
    !habit.deadline ||
    !habit.target_value ||
    !habit.target_unit
  ) {
    return null;
  }

  const start = parseISO(habit.created_at);
  const deadline = parseISO(habit.deadline);
  const totalDays = differenceInCalendarDays(deadline, start);
  const daysElapsed = Math.max(0, differenceInCalendarDays(today, start));
  const daysRemaining = differenceInCalendarDays(deadline, today);

  if (totalDays <= 0 || daysRemaining <= 0) return null;

  const expectedToday = (habit.target_value * daysElapsed) / totalDays;
  const bandLow = expectedToday * (1 - BAND);
  const current = achieveTotal(logs);
  if (current >= bandLow) return null;

  const remaining = habit.target_value - current;
  const perDay = remaining / daysRemaining;
  if (!Number.isFinite(perDay) || perDay <= 0) return null;

  return {
    perDay: Math.ceil(perDay * 10) / 10,
    unit: habit.target_unit,
    daysRemaining,
  };
}
