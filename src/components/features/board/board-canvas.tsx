"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { createPortal } from "react-dom";

import { useBoardStore } from "@/stores/board-store";
import { useCreateTask, useReorderColumns, useMoveTask } from "@/hooks/use-board";
import { KanbanColumn } from "@/components/features/board/kanban-column";
import { TaskCard } from "@/components/features/task/task-card";
import { TaskModal } from "@/components/features/task/task-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BoardWithColumns, ColumnWithTasks, TaskWithRelations } from "@/types";

interface BoardCanvasProps {
  initialBoard: BoardWithColumns;
}

export function BoardCanvas({ initialBoard }: BoardCanvasProps) {
  const { board, setBoard, moveTask, reorderColumns } = useBoardStore();
  const activeBoard = board ?? initialBoard;

  // Hydrate the store on first render
  if (!board) setBoard(initialBoard);

  // Active drag tracking
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnWithTasks | null>(null);

  // Task detail modal
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  // Add column inline form
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // Mutations
  const createTask = useCreateTask(activeBoard.id);
  const reorderColumnsMutation = useReorderColumns(activeBoard.id);
  const moveTaskMutation = useMoveTask(activeBoard.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columnIds = activeBoard.columns.map((c) => c.id);

  // ── Drag handlers ──────────────────────────────────────────

  const onDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "TASK") setActiveTask(data.task);
    if (data?.type === "COLUMN") setActiveColumn(data.column);
  }, []);

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (activeData?.type !== "TASK") return;

      const activeTask = activeData.task as TaskWithRelations;
      const fromColumnId = activeTask.columnId;

      let toColumnId: string;

      if (overData?.type === "COLUMN") {
        toColumnId = over.id as string;
      } else if (overData?.type === "TASK") {
        toColumnId = (overData.task as TaskWithRelations).columnId;
      } else {
        return;
      }

      if (fromColumnId === toColumnId) return;

      // Optimistic move to new column, position at end
      const toColumn = activeBoard.columns.find((c) => c.id === toColumnId);
      const newPosition = toColumn?.tasks.length ?? 0;

      moveTask(activeTask.id, fromColumnId, toColumnId, newPosition);
    },
    [activeBoard.columns, moveTask]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      setActiveColumn(null);

      if (!over || active.id === over.id) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // ── Column reorder ─────────────────────────────────────
      if (activeData?.type === "COLUMN" && overData?.type === "COLUMN") {
        const oldIndex = columnIds.indexOf(active.id as string);
        const newIndex = columnIds.indexOf(over.id as string);
        const newOrder = arrayMove(columnIds, oldIndex, newIndex);

        reorderColumns(newOrder);
        reorderColumnsMutation.mutate(newOrder);
        return;
      }

      // ── Task move / reorder ────────────────────────────────
      if (activeData?.type === "TASK") {
        const task = activeData.task as TaskWithRelations;

        let toColumnId = task.columnId;
        let targetPosition = 0;

        if (overData?.type === "COLUMN") {
          toColumnId = over.id as string;
          const col = activeBoard.columns.find((c) => c.id === toColumnId);
          targetPosition = col?.tasks.length ?? 0;
        } else if (overData?.type === "TASK") {
          const overTask = overData.task as TaskWithRelations;
          toColumnId = overTask.columnId;
          const col = activeBoard.columns.find((c) => c.id === toColumnId);
          targetPosition = col?.tasks.findIndex((t) => t.id === over.id) ?? 0;
        }

        moveTaskMutation.mutate({
          taskId: task.id,
          toColumnId,
          position: targetPosition,
        });
      }
    },
    [
      activeBoard.columns,
      columnIds,
      moveTask,
      reorderColumns,
      reorderColumnsMutation,
      moveTaskMutation,
    ]
  );

  // ── Add task ───────────────────────────────────────────────

  const handleAddTask = useCallback(
    (columnId: string, title: string) => {
      createTask.mutate({ title, columnId, boardId: activeBoard.id });
    },
    [createTask, activeBoard.id]
  );

  // ── Add column ─────────────────────────────────────────────

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    await fetch(`/api/boards/${activeBoard.id}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newColumnName.trim() }),
    });
    setNewColumnName("");
    setShowAddColumn(false);
    // Refetch via query invalidation is handled server-side; reload for now
    window.location.reload();
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex h-full gap-4 overflow-x-auto p-6">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {activeBoard.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddTask={handleAddTask}
                onTaskClick={setSelectedTask}
                isAddingTask={createTask.isPending}
              />
            ))}
          </SortableContext>

          {/* Add column */}
          <div className="w-72 flex-shrink-0">
            {showAddColumn ? (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 space-y-2">
                <Input
                  autoFocus
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") setShowAddColumn(false);
                  }}
                  placeholder="Column name..."
                  className="border-slate-600 bg-slate-700 text-sm text-slate-100 placeholder:text-slate-500"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 bg-indigo-500 text-xs hover:bg-indigo-600"
                    onClick={handleAddColumn}
                    disabled={!newColumnName.trim()}
                  >
                    Add column
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-400"
                    onClick={() => setShowAddColumn(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddColumn(true)}
                className="flex h-12 w-full items-center gap-2 rounded-xl border border-dashed border-slate-700 px-4 text-sm text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
              >
                <Plus className="h-4 w-4" />
                Add column
              </button>
            )}
          </div>
        </div>

        {/* Drag overlay — renders the ghost of the dragged item */}
        {typeof document !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  onClick={() => {}}
                  isOverlay
                />
              )}
              {activeColumn && (
                <KanbanColumn
                  column={activeColumn}
                  onAddTask={() => {}}
                  onTaskClick={() => {}}
                />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          boardId={activeBoard.id}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
