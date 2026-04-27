import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AddHabitForm } from "../components/AddHabitForm";
import { HabitRow } from "../components/HabitRow";
import {
  archiveHabit,
  createHabit,
  deleteHabit,
  listAllHabits,
  unarchiveHabit,
  updateHabit,
  type Habit,
  type HabitInput,
} from "../lib/queries";

type EditTarget = { kind: "new" } | { kind: "existing"; id: string } | null;

export function Habits() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditTarget>(null);

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits", "all"],
    queryFn: listAllHabits,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["habits"] });

  const createMutation = useMutation({
    mutationFn: (input: HabitInput) => createHabit(input),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<HabitInput> }) =>
      updateHabit(id, patch),
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archiveHabit(id),
    onSuccess: invalidate,
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => unarchiveHabit(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHabit(id),
    onSuccess: invalidate,
  });

  const active = habits.filter((h) => h.archived_at === null);
  const archived = habits.filter((h) => h.archived_at !== null);

  const handleSave = (input: HabitInput) => {
    if (editing?.kind === "new") {
      createMutation.mutate(input);
    } else if (editing?.kind === "existing") {
      updateMutation.mutate({ id: editing.id, patch: input });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const editingHabit =
    editing?.kind === "existing"
      ? habits.find((h) => h.id === editing.id)
      : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl px-10 py-12">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl text-text-primary">Habits</h1>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing({ kind: "new" })}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors duration-300 ease-soft hover:bg-bg-subtle hover:text-text-primary"
          >
            <Plus strokeWidth={1.5} size={16} />
            <span>Add habit</span>
          </button>
        )}
      </header>

      {editing?.kind === "new" && (
        <div className="mt-8">
          <AddHabitForm
            mode="create"
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={isSaving}
          />
        </div>
      )}

      {editing?.kind === "existing" && editingHabit && (
        <div className="mt-8">
          <AddHabitForm
            mode="edit"
            initial={editingHabit}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            saving={isSaving}
          />
        </div>
      )}

      <section className="mt-10">
        <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
          Active{active.length > 0 ? ` · ${active.length}` : ""}
        </h2>
        {isLoading ? (
          <p className="mt-6 font-display italic text-sm text-text-tertiary">
            Loading…
          </p>
        ) : active.length === 0 ? (
          <p className="mt-6 font-display italic text-sm text-text-tertiary">
            No active habits yet.
          </p>
        ) : (
          <ul className="mt-2">
            {active.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                onEdit={() => setEditing({ kind: "existing", id: h.id })}
                onArchive={() => archiveMutation.mutate(h.id)}
                onUnarchive={() => unarchiveMutation.mutate(h.id)}
                onDelete={() => deleteMutation.mutate(h.id)}
              />
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-wider text-text-tertiary">
            Archived · {archived.length}
          </h2>
          <ul className="mt-2 opacity-70">
            {archived.map((h: Habit) => (
              <HabitRow
                key={h.id}
                habit={h}
                onEdit={() => setEditing({ kind: "existing", id: h.id })}
                onArchive={() => archiveMutation.mutate(h.id)}
                onUnarchive={() => unarchiveMutation.mutate(h.id)}
                onDelete={() => deleteMutation.mutate(h.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
