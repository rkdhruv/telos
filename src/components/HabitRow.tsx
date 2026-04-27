import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import type { Habit } from "../lib/queries";

interface Props {
  habit: Habit;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}

function summary(habit: Habit): string {
  if (habit.type === "build") {
    if (habit.cadence === "weekly" && habit.weekly_target) {
      return `Build · ${habit.weekly_target}× per week`;
    }
    return "Build · daily";
  }
  if (habit.type === "quit") return "Quit";
  if (habit.type === "achieve" && habit.target_value && habit.target_unit) {
    return `Achieve · ${habit.target_value} ${habit.target_unit}${habit.deadline ? ` by ${habit.deadline}` : ""}`;
  }
  return "Achieve";
}

export function HabitRow({ habit, onEdit, onArchive, onUnarchive, onDelete }: Props) {
  const isArchived = habit.archived_at !== null;

  return (
    <li className="group flex items-center justify-between border-b border-border px-2 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate font-display text-lg text-text-primary">
          {habit.name}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">{summary(habit)}</p>
      </div>

      <div className="flex items-center gap-1 opacity-60 transition-opacity duration-300 ease-soft group-hover:opacity-100">
        {!isArchived ? (
          <>
            <IconButton label="Edit" onClick={onEdit}>
              <Pencil strokeWidth={1.5} size={16} />
            </IconButton>
            <IconButton label="Archive" onClick={onArchive}>
              <Archive strokeWidth={1.5} size={16} />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton label="Restore" onClick={onUnarchive}>
              <ArchiveRestore strokeWidth={1.5} size={16} />
            </IconButton>
            <IconButton label="Delete" onClick={onDelete} danger>
              <Trash2 strokeWidth={1.5} size={16} />
            </IconButton>
          </>
        )}
      </div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle " +
        (danger ? "hover:text-text-primary" : "hover:text-text-primary")
      }
    >
      {children}
    </button>
  );
}
