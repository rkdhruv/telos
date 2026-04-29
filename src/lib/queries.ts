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

// ---------- logs ----------

export interface LogUpsertInput {
  habit_id: string;
  date: string;
  status: LogStatus;
  value?: number | null;
  note?: string | null;
}

export async function listLogsForHabit(habitId: string): Promise<HabitLog[]> {
  const db = await getDb();
  return db.select<HabitLog[]>(
    "SELECT * FROM logs WHERE habit_id = ? ORDER BY date ASC",
    [habitId],
  );
}

export async function upsertLog(input: LogUpsertInput): Promise<HabitLog> {
  const db = await getDb();
  const existing = await db.select<HabitLog[]>(
    "SELECT * FROM logs WHERE habit_id = ? AND date = ? LIMIT 1",
    [input.habit_id, input.date],
  );
  const created_at = nowIso();

  if (existing[0]) {
    await db.execute(
      "UPDATE logs SET status = ?, value = ?, note = ? WHERE id = ?",
      [input.status, input.value ?? null, input.note ?? null, existing[0].id],
    );
    const rows = await db.select<HabitLog[]>("SELECT * FROM logs WHERE id = ?", [
      existing[0].id,
    ]);
    if (!rows[0]) throw new Error("Failed to read back updated log");
    return rows[0];
  }

  const id = newId();
  await db.execute(
    `INSERT INTO logs (id, habit_id, date, status, value, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.habit_id,
      input.date,
      input.status,
      input.value ?? null,
      input.note ?? null,
      created_at,
    ],
  );
  const rows = await db.select<HabitLog[]>("SELECT * FROM logs WHERE id = ?", [id]);
  if (!rows[0]) throw new Error("Failed to read back created log");
  return rows[0];
}

export async function deleteLogForDate(
  habit_id: string,
  date: string,
): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM logs WHERE habit_id = ? AND date = ?", [
    habit_id,
    date,
  ]);
}

// ---------- verses ----------

export async function listVerses(): Promise<Verse[]> {
  const db = await getDb();
  return db.select<Verse[]>("SELECT * FROM verses ORDER BY created_at ASC");
}

export async function addVerses(
  verses: { text: string; reference: string | null }[],
): Promise<void> {
  if (verses.length === 0) return;
  const db = await getDb();
  for (const v of verses) {
    await db.execute(
      "INSERT INTO verses (id, text, reference, created_at) VALUES (?, ?, ?, ?)",
      [newId(), v.text, v.reference, nowIso()],
    );
  }
}

export async function deleteVerse(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM verses WHERE id = ?", [id]);
}

// ---------- non-negotiables ----------

export async function listNonNegotiables(): Promise<NonNegotiable[]> {
  const db = await getDb();
  return db.select<NonNegotiable[]>(
    "SELECT * FROM non_negotiables WHERE archived_at IS NULL ORDER BY created_at ASC",
  );
}

export async function createNonNegotiable(text: string): Promise<NonNegotiable> {
  const db = await getDb();
  const id = newId();
  const created_at = nowIso();
  await db.execute(
    "INSERT INTO non_negotiables (id, text, created_at) VALUES (?, ?, ?)",
    [id, text, created_at],
  );
  const rows = await db.select<NonNegotiable[]>(
    "SELECT * FROM non_negotiables WHERE id = ?",
    [id],
  );
  if (!rows[0]) throw new Error("Failed to read back created non-negotiable");
  return rows[0];
}

export async function updateNonNegotiable(id: string, text: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE non_negotiables SET text = ? WHERE id = ?", [text, id]);
}

export async function archiveNonNegotiable(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE non_negotiables SET archived_at = ? WHERE id = ?", [
    nowIso(),
    id,
  ]);
}

// ---------- violations ----------

export async function listAllViolations(): Promise<Violation[]> {
  const db = await getDb();
  return db.select<Violation[]>(
    "SELECT * FROM violations ORDER BY date ASC, created_at ASC",
  );
}

export async function addViolation(input: {
  non_negotiable_id: string;
  date: string;
  note?: string | null;
}): Promise<Violation> {
  const db = await getDb();
  const id = newId();
  const created_at = nowIso();
  await db.execute(
    "INSERT INTO violations (id, non_negotiable_id, date, note, created_at) VALUES (?, ?, ?, ?, ?)",
    [id, input.non_negotiable_id, input.date, input.note ?? null, created_at],
  );
  const rows = await db.select<Violation[]>(
    "SELECT * FROM violations WHERE id = ?",
    [id],
  );
  if (!rows[0]) throw new Error("Failed to read back created violation");
  return rows[0];
}

export async function updateViolationNote(
  id: string,
  note: string | null,
): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE violations SET note = ? WHERE id = ?", [note, id]);
}

export async function deleteViolation(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM violations WHERE id = ?", [id]);
}

// ---------- export / reset ----------

export interface ExportPayload {
  version: number;
  exportedAt: string;
  habits: Habit[];
  logs: HabitLog[];
  non_negotiables: NonNegotiable[];
  violations: Violation[];
  verses: Verse[];
}

export async function exportData(): Promise<ExportPayload> {
  const db = await getDb();
  const [habits, logs, nonNegotiables, violations, verses] = await Promise.all([
    db.select<Habit[]>("SELECT * FROM habits ORDER BY created_at ASC"),
    db.select<HabitLog[]>("SELECT * FROM logs ORDER BY date ASC, created_at ASC"),
    db.select<NonNegotiable[]>(
      "SELECT * FROM non_negotiables ORDER BY created_at ASC",
    ),
    db.select<Violation[]>(
      "SELECT * FROM violations ORDER BY date ASC, created_at ASC",
    ),
    db.select<Verse[]>("SELECT * FROM verses ORDER BY created_at ASC"),
  ]);
  return {
    version: 1,
    exportedAt: nowIso(),
    habits,
    logs,
    non_negotiables: nonNegotiables,
    violations,
    verses,
  };
}

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  // Order matters for FK cascades, though ON DELETE CASCADE would handle it.
  await db.execute("DELETE FROM violations");
  await db.execute("DELETE FROM logs");
  await db.execute("DELETE FROM non_negotiables");
  await db.execute("DELETE FROM habits");
  await db.execute("DELETE FROM verses");
}
