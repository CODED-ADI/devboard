import type {
  Board,
  Column,
  Task,
  Label,
  User,
  Priority,
  TaskStatus,
  SyncStatus,
  ActivityEvent,
} from "@prisma/client";

// Re-export Prisma enums so the rest of the app imports from one place
export type { Priority, TaskStatus, SyncStatus, ActivityEvent };

// ─────────────────────────────────────────────
// Hydrated types (with relations pre-loaded)
// ─────────────────────────────────────────────

export type TaskWithRelations = Task & {
  assignee: Pick<User, "id" | "name" | "image"> | null;
  labels: { label: Label }[];
};

export type ColumnWithTasks = Column & {
  tasks: TaskWithRelations[];
};

export type BoardWithColumns = Board & {
  columns: ColumnWithTasks[];
  labels: Label[];
};

// ─────────────────────────────────────────────
// Drag & drop identifiers
// ─────────────────────────────────────────────

export type DraggableType = "TASK" | "COLUMN";

export interface DragItem {
  type: DraggableType;
  id: string;
  columnId?: string; // set when type === "TASK"
}
