import type { Habit, HabitLog } from "../lib/queries";
import { AchieveGraph } from "./AchieveGraph";
import { BuildGraph } from "./BuildGraph";
import { QuitGraph } from "./QuitGraph";

interface Props {
  habit: Habit;
  logs: HabitLog[];
}

export function HabitGraph({ habit, logs }: Props) {
  if (habit.type === "build") return <BuildGraph habit={habit} logs={logs} />;
  if (habit.type === "quit") return <QuitGraph habit={habit} logs={logs} />;
  if (habit.type === "achieve") return <AchieveGraph habit={habit} logs={logs} />;
  return null;
}
