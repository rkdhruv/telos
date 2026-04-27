import { getDb } from "./db";
import { newId } from "./ids";
import { nowIso } from "./dates";

export type HabitType = "build" | "quit" | "achieve";
export type HabitCadence = "daily" | "weekly";
export type LogStatus = "hit" | "partial" | "miss";

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  created_at: string;
  archived_at: string | null;
  cadence: HabitCadence | null;
  weekly_target: number | null;
  target_value: number | null;
  target_unit: string | null;
  deadline: string | null;
  notes: string | null;
}

export interface HabitInput {
  name: string;
  type: HabitType;
  cadence?: HabitCadence | null;
  weekly_target?: number | null;
  target_value?: number | null;
  target_unit?: string | null;
  deadline?: string | null;
  notes?: string | null;
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

// ---------- habits ----------

export async function listHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.select<Habit[]>(
    "SELECT * FROM habits WHERE archived_at IS NULL ORDER BY created_at ASC, name ASC",
  );
}

export async function listAllHabits(): Promise<Habit[]> {
  const db = await getDb();
  return db.select<Habit[]>(
    "SELECT * FROM habits ORDER BY archived_at IS NOT NULL, created_at ASC, name ASC",
  );
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const db = await getDb();
  const id = newId();
  const created_at = nowIso();
  await db.execute(
    `INSERT INTO habits (id, name, type, created_at, cadence, weekly_target, target_value, target_unit, deadline, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.type,
      created_at,
      input.cadence ?? null,
      input.weekly_target ?? null,
      input.target_value ?? null,
      input.target_unit ?? null,
      input.deadline ?? null,
      input.notes ?? null,
    ],
  );
  const rows = await db.select<Habit[]>("SELECT * FROM habits WHERE id = ?", [id]);
  if (!rows[0]) throw new Error("Failed to read back created habit");
  return rows[0];
}

const EDITABLE_HABIT_COLUMNS = new Set([
  "name",
  "cadence",
  "weekly_target",
  "target_value",
  "target_unit",
  "deadline",
  "notes",
]);

export async function updateHabit(
  id: string,
  patch: Partial<HabitInput>,
): Promise<void> {
  const db = await getDb();
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(patch)) {
    if (!EDITABLE_HABIT_COLUMNS.has(key)) continue;
    sets.push(`${key} = ?`);
    values.push(value ?? null);
  }
  if (sets.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE habits SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function archiveHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE habits SET archived_at = ? WHERE id = ?", [nowIso(), id]);
}

export async function unarchiveHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE habits SET archived_at = NULL WHERE id = ?", [id]);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM habits WHERE id = ?", [id]);
}

// ---------- verses ----------

export async function listVerses(): Promise<Verse[]> {
  const db = await getDb();
  return db.select<Verse[]>("SELECT * FROM verses ORDER BY created_at ASC");
}

// ---------- non-negotiables ----------

export async function listNonNegotiables(): Promise<NonNegotiable[]> {
  const db = await getDb();
  return db.select<NonNegotiable[]>(
    "SELECT * FROM non_negotiables WHERE archived_at IS NULL ORDER BY created_at ASC",
  );
}
