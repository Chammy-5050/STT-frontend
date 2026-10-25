import type { TaskItem } from "./types";
import { deadlineFor } from "./deadlines";

export default function DeadlineBadge({ task, today }: { task: Pick<TaskItem, "status" | "dueDate">; today?: Date }) {
  const deadline = deadlineFor(task, today);
  return deadline ? <span className={`deadline-badge deadline-${deadline.kind}`}>{deadline.label}</span> : null;
}
