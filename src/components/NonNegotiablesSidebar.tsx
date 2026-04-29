import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ChevronLeft,
  Pencil,
  Plus,
  Shield,
} from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";
import {
  addViolation,
  archiveNonNegotiable,
  createNonNegotiable,
  deleteViolation,
  listAllViolations,
  listNonNegotiables,
  updateNonNegotiable,
  updateViolationNote,
  type NonNegotiable,
  type Violation,
} from "../lib/queries";
import { todayIsoDate } from "../lib/dates";
import { useAppStore } from "../store/useAppStore";

export function NonNegotiablesSidebar() {
  const open = useAppStore((s) => s.nonNegSidebarOpen);
  const toggle = useAppStore((s) => s.toggleNonNegSidebar);

  if (!open) {
    return (
      <aside className="flex h-full w-10 shrink-0 flex-col items-center border-r border-border bg-bg-elevated py-4">
        <button
          type="button"
          onClick={toggle}
          aria-label="Show non-negotiables"
          title="Non-negotiables"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-text-tertiary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
        >
          <Shield strokeWidth={1.5} size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-bg-elevated">
      <SidebarBody onCollapse={toggle} />
    </aside>
  );
}

function SidebarBody({ onCollapse }: { onCollapse: () => void }) {
  const queryClient = useQueryClient();
  const today = todayIsoDate();
  const [adding, setAdding] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["non-negotiables"],
    queryFn: listNonNegotiables,
  });

  const { data: violations = [] } = useQuery({
    queryKey: ["violations"],
    queryFn: listAllViolations,
  });

  const invalidateNN = () =>
    queryClient.invalidateQueries({ queryKey: ["non-negotiables"] });
  const invalidateViolations = () =>
    queryClient.invalidateQueries({ queryKey: ["violations"] });

  const createMutation = useMutation({
    mutationFn: (text: string) => createNonNegotiable(text),
    onSuccess: () => {
      invalidateNN();
      setAdding(false);
    },
  });

  const violationsByNn = useMemo(() => {
    const map = new Map<string, Violation[]>();
    for (const v of violations) {
      const arr = map.get(v.non_negotiable_id) ?? [];
      arr.push(v);
      map.set(v.non_negotiable_id, arr);
    }
    return map;
  }, [violations]);

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
          Non-negotiables
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label="Add non-negotiable"
            title="Add"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
          >
            <Plus strokeWidth={1.5} size={14} />
          </button>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse"
            title="Collapse"
            className="flex h-7 w-7 items-center justify-center rounded-sm text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
          >
            <ChevronLeft strokeWidth={1.5} size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {adding && (
          <div className="mb-3">
            <NonNegEditor
              onSave={(text) => createMutation.mutate(text)}
              onCancel={() => setAdding(false)}
              saving={createMutation.isPending}
              autoFocus
            />
          </div>
        )}

        {items.length === 0 && !adding ? (
          <p className="mt-4 px-2 font-display italic text-sm leading-relaxed text-text-tertiary">
            Things you don't compromise on. Tap + to add.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <NonNegItem
                key={item.id}
                item={item}
                violations={violationsByNn.get(item.id) ?? []}
                today={today}
                onChanged={() => {
                  invalidateNN();
                  invalidateViolations();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function NonNegItem({
  item,
  violations,
  today,
  onChanged,
}: {
  item: NonNegotiable;
  violations: Violation[];
  today: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (text: string) => updateNonNegotiable(item.id, text),
    onSuccess: () => {
      onChanged();
      setEditing(false);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveNonNegotiable(item.id),
    onSuccess: onChanged,
  });

  const addMutation = useMutation({
    mutationFn: (note: string | null) =>
      addViolation({ non_negotiable_id: item.id, date: today, note }),
    onSuccess: onChanged,
  });

  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | null }) =>
      updateViolationNote(id, note),
    onSuccess: onChanged,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteViolation(id),
    onSuccess: onChanged,
  });

  const monthCount = useMemo(() => {
    const monthStart = format(startOfMonth(parseISO(today)), "yyyy-MM-dd");
    return violations.filter((v) => v.date >= monthStart).length;
  }, [violations, today]);

  const todaysViolation = useMemo(() => {
    const todays = violations.filter((v) => v.date === today);
    if (todays.length === 0) return undefined;
    return todays.reduce((latest, v) =>
      v.created_at > latest.created_at ? v : latest,
    );
  }, [violations, today]);

  if (editing) {
    return (
      <li className="rounded border border-border bg-bg-base p-3">
        <NonNegEditor
          initial={item.text}
          onSave={(text) => updateMutation.mutate(text)}
          onCancel={() => setEditing(false)}
          saving={updateMutation.isPending}
          autoFocus
        />
      </li>
    );
  }

  return (
    <li className="group rounded border border-border bg-bg-base p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-sm leading-snug text-text-primary">
          {item.text}
        </p>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-300 ease-soft group-hover:opacity-70">
          <IconButton label="Edit" onClick={() => setEditing(true)}>
            <Pencil strokeWidth={1.5} size={12} />
          </IconButton>
          <IconButton label="Archive" onClick={() => archiveMutation.mutate()}>
            <Archive strokeWidth={1.5} size={12} />
          </IconButton>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => addMutation.mutate(null)}
          disabled={addMutation.isPending}
          className="text-xs text-text-secondary underline-offset-4 transition-colors duration-300 ease-soft hover:text-text-primary hover:underline disabled:opacity-50"
        >
          Log violation
        </button>
        <span className="text-[11px] text-text-tertiary">
          {monthCount === 0 ? "none this month" : `${monthCount} this month`}
        </span>
      </div>

      {todaysViolation && (
        <TodayViolation
          violation={todaysViolation}
          onSaveNote={(note) =>
            noteMutation.mutate({ id: todaysViolation.id, note })
          }
          onUndo={() => deleteMutation.mutate(todaysViolation.id)}
        />
      )}
    </li>
  );
}

function TodayViolation({
  violation,
  onSaveNote,
  onUndo,
}: {
  violation: Violation;
  onSaveNote: (note: string | null) => void;
  onUndo: () => void;
}) {
  const initial = violation.note ?? "";
  const [note, setNote] = useState(initial);

  useEffect(() => {
    setNote(initial);
  }, [initial]);

  const commit = () => {
    const trimmed = note.trim();
    const next = trimmed === "" ? null : trimmed;
    if (next === (violation.note ?? null)) return;
    onSaveNote(next);
  };

  return (
    <div className="mt-2 border-t border-border pt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-tertiary">logged today</span>
        <button
          type="button"
          onClick={onUndo}
          className="text-[11px] text-text-tertiary underline-offset-4 transition-colors duration-300 ease-soft hover:text-text-secondary hover:underline"
        >
          undo
        </button>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="note (optional)"
        className="mt-1 w-full rounded-sm border border-transparent bg-transparent px-1 py-0.5 text-xs text-text-secondary placeholder:text-text-tertiary focus:border-border focus:bg-bg-subtle focus:outline-none"
      />
    </div>
  );
}

function NonNegEditor({
  initial = "",
  onSave,
  onCancel,
  saving,
  autoFocus,
}: {
  initial?: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  saving?: boolean;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState(initial);
  const trimmed = text.trim();
  const valid = trimmed.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave(trimmed);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        rows={2}
        placeholder="In bed by 11 pm"
        className="w-full resize-none rounded-sm border border-border bg-bg-base px-2 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-text-secondary transition-colors duration-300 ease-soft hover:text-text-primary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid || saving}
          className="rounded-sm border border-accent bg-accent-soft px-3 py-1 text-xs text-text-primary transition-colors duration-300 ease-soft hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-6 w-6 items-center justify-center rounded-sm text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
    >
      {children}
    </button>
  );
}
