"use client";

import { useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/features/task/task-card";
import { AddTaskForm } from "@/components/features/board/add-task-form";
import type { ColumnWithTasks, TaskWithRelations } from "@/types";

interface KanbanColumnProps {
  column: ColumnWithTasks;
  onAddTask: (columnId: string, title: string) => void;
  onTaskClick: (task: TaskWithRelations) => void;
  isAddingTask?: boolean;
}

export function KanbanColumn({
  column,
  onAddTask,
  onTaskClick,
  isAddingTask,
}: KanbanColumnProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: "COLUMN", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = column.tasks.map((t) => t.id);
  const isAtLimit = column.taskLimit != null && column.tasks.length >= column.taskLimit;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex w-72 flex-shrink-0 flex-col rounded-xl border border-slate-700/50 bg-slate-900/60",
        isDragging && "opacity-40 ring-2 ring-indigo-500",
        isOver && !isDragging && "ring-2 ring-indigo-500/50"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Column drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-slate-600 hover:text-slate-400 active:cursor-grabbing flex-shrink-0"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <h3 className="truncate text-sm font-semibold text-slate-200">
            {column.name}
          </h3>

          <span className="flex-shrink-0 rounded-full bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            {column.tasks.length}
            {column.taskLimit != null && `/${column.taskLimit}`}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 flex-shrink-0 p-0 text-slate-600 hover:text-slate-300"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* WIP limit warning */}
      {isAtLimit && (
        <div className="mx-3 mb-2 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] text-amber-400">
          WIP limit reached ({column.taskLimit})
        </div>
      )}

      {/* Task list */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2">
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}

          {/* Drop zone when column is empty */}
          {column.tasks.length === 0 && (
            <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-slate-700 text-xs text-slate-600">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add task section */}
      <div className="border-t border-slate-800 p-3">
        {showAddForm ? (
          <AddTaskForm
            onAdd={(title) => {
              onAddTask(column.id, title);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
            isLoading={isAddingTask}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full justify-start gap-1.5 text-xs text-slate-500 hover:text-slate-300"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </Button>
        )}
      </div>
    </div>
  );
}
