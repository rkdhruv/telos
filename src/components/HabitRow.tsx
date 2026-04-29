import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todayIsoDate } from "../lib/dates";
import {
  deleteLogForDate,
  listLogsForHabit,
  upsertLog,
  type Habit,
  type HabitLog,
  type LogStatus,
  type LogUpsertInput,
} from "../lib/queries";
import {
  achieveTotal,
  dailyBuildStreak,
  findLogForDate,
  quitStreak,
  weeklyBuildHits,
} from "../lib/streaks";
import { newId } from "../lib/ids";

import { HabitGraph } from "./HabitGraph";

interface Props {
  habit: Habit;
  expanded: boolean;
  onToggle: () => void;
}

export function HabitRow({ habit, expanded, onToggle }: Props) {
  const queryClient = useQueryClient();
  const today = todayIsoDate();
  const queryKey = ["logs", habit.id] as const;

  const { data: logs = [] } = useQuery({
    queryKey,
    queryFn: () => listLogsForHabit(habit.id),
  });

  const upsertMutation = useMutation({
    mutationFn: (input: LogUpsertInput) => upsertLog(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HabitLog[]>(queryKey) ?? [];
      const existing = previous.find((l) => l.date === input.date);
      const optimistic: HabitLog = {
        id: existing?.id ?? `optimistic-${newId()}`,
        habit_id: input.habit_id,
        date: input.date,
        status: input.status,
        value: input.value ?? null,
        note: input.note ?? null,
        created_at: existing?.created_at ?? new Date().toISOString(),
      };
      const next = [...previous.filter((l) => l.date !== input.date), optimistic];
      queryClient.setQueryData<HabitLog[]>(queryKey, next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ date }: { date: string }) =>
      deleteLogForDate(habit.id, date),
    onMutate: async ({ date }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HabitLog[]>(queryKey) ?? [];
      queryClient.setQueryData<HabitLog[]>(
        queryKey,
        previous.filter((l) => l.date !== date),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) queryClient.setQueryData(queryKey, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const todaysLog = findLogForDate(logs, today);

  const setStatus = (status: LogStatus, value?: number | null) => {
    if (todaysLog?.status === status && value === undefined) {
      // Tap-to-toggle: same status removes the log entirely.
      deleteMutation.mutate({ date: today });
    } else {
      upsertMutation.mutate({
        habit_id: habit.id,
        date: today,
        status,
        value: value ?? null,
      });
    }
  };

  const clearToday = () => deleteMutation.mutate({ date: today });

  return (
    <li className="border-b border-border last:border-b-0">
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-center justify-between gap-6 px-2 py-5 transition-colors duration-300 ease-soft hover:bg-bg-subtle"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg text-text-primary">
            {habit.name}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">
            <SummaryLine habit={habit} logs={logs} />
          </p>
        </div>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        {habit.type === "build" && (
          <BuildControls todaysLog={todaysLog} onSet={setStatus} />
        )}
        {habit.type === "quit" && (
          <QuitControls
            todaysLog={todaysLog}
            onClean={() => setStatus("hit")}
            onSlip={() => setStatus("miss")}
            onClear={clearToday}
          />
        )}
        {habit.type === "achieve" && (
          <AchieveControls
            habit={habit}
            todaysLog={todaysLog}
            onSave={(value) =>
              upsertMutation.mutate({
                habit_id: habit.id,
                date: today,
                status: "hit",
                value,
              })
            }
            onClear={clearToday}
          />
        )}
        </div>
      </div>

      {expanded && (
        <div className="px-2 pb-6">
          <HabitGraph habit={habit} logs={logs} />
        </div>
      )}
    </li>
  );
}

// ---------- summary line ----------

function SummaryLine({ habit, logs }: { habit: Habit; logs: HabitLog[] }) {
  const today = new Date();

  if (habit.type === "build") {
    if (habit.cadence === "weekly" && habit.weekly_target) {
      const hits = weeklyBuildHits(logs, today);
      return (
        <>
          {hits} / {habit.weekly_target} this week
        </>
      );
    }
    const streak = dailyBuildStreak(logs, today);
    return streak > 0 ? <>{streak} day streak</> : <>Daily</>;
  }

  if (habit.type === "quit") {
    const streak = quitStreak(logs, habit, today);
    if (streak === 0) return <>Day one</>;
    if (streak === 1) return <>1 day clean</>;
    return <>{streak} days clean</>;
  }

  if (habit.type === "achieve") {
    const total = achieveTotal(logs);
    if (habit.target_value && habit.target_unit) {
      const pct = Math.round((total / habit.target_value) * 100);
      return (
        <>
          {total} / {habit.target_value} {habit.target_unit} · {pct}%
        </>
      );
    }
    return <>{total}</>;
  }

  return null;
}

// ---------- controls per type ----------

const STATUS_DOTS: { value: LogStatus; label: string }[] = [
  { value: "miss", label: "Miss" },
  { value: "partial", label: "Partial" },
  { value: "hit", label: "Hit" },
];

function BuildControls({
  todaysLog,
  onSet,
}: {
  todaysLog: HabitLog | undefined;
  onSet: (status: LogStatus) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {STATUS_DOTS.map((dot) => {
        const active = todaysLog?.status === dot.value;
        return (
          <button
            key={dot.value}
            type="button"
            onClick={() => onSet(dot.value)}
            aria-label={dot.label}
            title={dot.label}
            className={
              "h-6 w-6 rounded-full border transition-colors duration-300 ease-soft " +
              (active
                ? dot.value === "miss"
                  ? "border-transparent bg-danger-soft"
                  : dot.value === "partial"
                    ? "border-accent bg-accent-soft"
                    : "border-transparent bg-accent"
                : "border-border hover:border-text-secondary")
            }
          />
        );
      })}
    </div>
  );
}

function QuitControls({
  todaysLog,
  onClean,
  onSlip,
  onClear,
}: {
  todaysLog: HabitLog | undefined;
  onClean: () => void;
  onSlip: () => void;
  onClear: () => void;
}) {
  const isClean = todaysLog?.status === "hit";
  const isSlipped = todaysLog?.status === "miss";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={isClean ? onClear : onClean}
        className={
          "rounded-sm border px-4 py-1.5 text-sm transition-colors duration-300 ease-soft " +
          (isClean
            ? "border-transparent bg-accent text-bg-base"
            : isSlipped
              ? "border-border text-text-tertiary hover:text-text-primary"
              : "border-border text-text-secondary hover:bg-bg-subtle hover:text-text-primary")
        }
      >
        {isClean ? "Clean today" : "Stayed clean today"}
      </button>
      {!isClean && (
        <button
          type="button"
          onClick={isSlipped ? onClear : onSlip}
          className="text-xs text-text-tertiary transition-colors duration-300 ease-soft hover:text-text-secondary"
        >
          {isSlipped ? "Clear" : "I slipped"}
        </button>
      )}
    </div>
  );
}

function AchieveControls({
  habit,
  todaysLog,
  onSave,
  onClear,
}: {
  habit: Habit;
  todaysLog: HabitLog | undefined;
  onSave: (value: number) => void;
  onClear: () => void;
}) {
  const initial = todaysLog?.value?.toString() ?? "";
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed === "") {
      if (todaysLog) onClear();
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n <= 0) {
      setValue(initial);
      return;
    }
    if (n === todaysLog?.value) return;
    onSave(n);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    commit();
    (e.target as HTMLFormElement).querySelector("input")?.blur();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step="any"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        placeholder="0"
        className="w-20 rounded-sm border border-border bg-bg-base px-2 py-1.5 text-right text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
      />
      <span className="text-xs text-text-tertiary">{habit.target_unit ?? ""}</span>
    </form>
  );
}
