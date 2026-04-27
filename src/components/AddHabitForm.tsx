import { useState, type FormEvent } from "react";
import type {
  Habit,
  HabitCadence,
  HabitInput,
  HabitType,
} from "../lib/queries";

interface Props {
  mode: "create" | "edit";
  initial?: Habit;
  onSave: (input: HabitInput) => void;
  onCancel: () => void;
  saving?: boolean;
}

interface FormState {
  type: HabitType;
  name: string;
  cadence: HabitCadence;
  weekly_target: string;
  target_value: string;
  target_unit: string;
  deadline: string;
  notes: string;
}

const emptyState = (): FormState => ({
  type: "build",
  name: "",
  cadence: "daily",
  weekly_target: "5",
  target_value: "",
  target_unit: "",
  deadline: "",
  notes: "",
});

const stateFromHabit = (h: Habit): FormState => ({
  type: h.type,
  name: h.name,
  cadence: h.cadence ?? "daily",
  weekly_target: h.weekly_target?.toString() ?? "5",
  target_value: h.target_value?.toString() ?? "",
  target_unit: h.target_unit ?? "",
  deadline: h.deadline ?? "",
  notes: h.notes ?? "",
});

const TYPE_OPTIONS: { value: HabitType; label: string; description: string }[] = [
  { value: "build", label: "Build", description: "a daily or weekly practice" },
  { value: "quit", label: "Quit", description: "something to stay away from" },
  { value: "achieve", label: "Achieve", description: "a goal with a deadline" },
];

export function AddHabitForm({ mode, initial, onSave, onCancel, saving }: Props) {
  const [state, setState] = useState<FormState>(() =>
    initial ? stateFromHabit(initial) : emptyState(),
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const trimmedName = state.name.trim();
  const isValid = (() => {
    if (!trimmedName) return false;
    if (state.type === "build" && state.cadence === "weekly") {
      const n = Number(state.weekly_target);
      if (!Number.isFinite(n) || n < 1 || n > 7) return false;
    }
    if (state.type === "achieve") {
      const n = Number(state.target_value);
      if (!Number.isFinite(n) || n <= 0) return false;
      if (!state.target_unit.trim()) return false;
      if (!state.deadline) return false;
    }
    return true;
  })();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const base: HabitInput = {
      name: trimmedName,
      type: state.type,
      notes: state.notes.trim() || null,
    };

    if (state.type === "build") {
      base.cadence = state.cadence;
      base.weekly_target =
        state.cadence === "weekly" ? Number(state.weekly_target) : null;
    } else if (state.type === "achieve") {
      base.target_value = Number(state.target_value);
      base.target_unit = state.target_unit.trim();
      base.deadline = state.deadline;
    }

    onSave(base);
  };

  const lockType = mode === "edit";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded border border-border bg-bg-elevated p-6"
    >
      <fieldset disabled={lockType} className="contents">
        <legend className="sr-only">Habit type</legend>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => {
            const active = state.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("type", opt.value)}
                className={
                  "rounded-sm border px-3 py-1.5 text-sm transition-colors duration-300 ease-soft " +
                  (active
                    ? "border-accent bg-accent-soft text-text-primary"
                    : "border-border text-text-secondary hover:text-text-primary")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-2 font-display italic text-xs text-text-tertiary">
        {TYPE_OPTIONS.find((t) => t.value === state.type)?.description}
      </p>

      <label className="mt-6 block">
        <span className="text-xs text-text-secondary">Name</span>
        <input
          autoFocus
          value={state.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder={
            state.type === "build"
              ? "Morning prayer"
              : state.type === "quit"
                ? "Doomscrolling"
                : "Read the Bible cover-to-cover"
          }
          className="mt-1 w-full rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </label>

      {state.type === "build" && (
        <div className="mt-4 flex items-end gap-4">
          <label className="block">
            <span className="text-xs text-text-secondary">Cadence</span>
            <div className="mt-1 flex gap-2">
              {(["daily", "weekly"] as HabitCadence[]).map((c) => {
                const active = state.cadence === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("cadence", c)}
                    className={
                      "rounded-sm border px-3 py-1.5 text-sm transition-colors duration-300 ease-soft " +
                      (active
                        ? "border-accent bg-accent-soft text-text-primary"
                        : "border-border text-text-secondary hover:text-text-primary")
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </label>

          {state.cadence === "weekly" && (
            <label className="block">
              <span className="text-xs text-text-secondary">Days per week</span>
              <input
                type="number"
                min={1}
                max={7}
                value={state.weekly_target}
                onChange={(e) => update("weekly_target", e.target.value)}
                className="mt-1 w-24 rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
            </label>
          )}
        </div>
      )}

      {state.type === "achieve" && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-text-secondary">Target</span>
            <input
              type="number"
              min={1}
              step="any"
              value={state.target_value}
              onChange={(e) => update("target_value", e.target.value)}
              placeholder="100"
              className="mt-1 w-full rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-secondary">Unit</span>
            <input
              value={state.target_unit}
              onChange={(e) => update("target_unit", e.target.value)}
              placeholder="pages"
              className="mt-1 w-full rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-text-secondary">Deadline</span>
            <input
              type="date"
              value={state.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="mt-1 w-full rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      )}

      <label className="mt-4 block">
        <span className="text-xs text-text-secondary">Notes <span className="text-text-tertiary">(optional)</span></span>
        <textarea
          value={state.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-sm border border-border bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
        />
      </label>

      <div className="mt-6 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-sm px-3 py-1.5 text-sm text-text-secondary transition-colors duration-300 ease-soft hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || saving}
          className="rounded-sm border border-accent bg-accent-soft px-4 py-1.5 text-sm text-text-primary transition-colors duration-300 ease-soft hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "create" ? "Add habit" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
