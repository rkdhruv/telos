import { getDb } from "./db";

export type HabitType = "build" | "quit" | "achieve";
export type LogStatus = "hit" | "partial" | "miss";

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  created_at: string;
  archived_at: string | null;
  cadence: "daily" | "weekly" | null;
  weekly_target: number | null;
  target_value: number | null;
  target_unit: string | null;
  deadline: string | null;
  notes: string | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  status: LogStatus;
  value: number | null;
  note: string | null;
  created_at: string;
}

export interface NonNegotiable {
  id: string;
  text: string;
  created_at: string;
  archived_at: string | null;
}

export interface Violation {
  id: string;
  non_negotiable_id: string;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Verse {
  id: string;
  text: string;
  reference: string | null;
  created_at: string;
}

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.select<Habit[]>(
    "SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at ASC, name ASC",
  );
}

export async function listVerses(): Promise<Verse[]> {
  const db = await getDb();
  return db.select<Verse[]>("SELECT * FROM verses ORDER BY created_at ASC");
}

export async function listNonNegotiables(): Promise<NonNegotiable[]> {
  const db = await getDb();
  return db.select<NonNegotiable[]>(
    "SELECT * FROM non_negotiables WHERE archived_at IS NULL ORDER BY created_at ASC",
  );
}
