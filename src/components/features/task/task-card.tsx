"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, GitBranch } from "lucide-react";
import { cn, relativeTime, getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TaskWithRelations } from "@/types";

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", class: "bg-red-500/20 text-red-400 border-red-500/30" },
  HIGH:   { label: "High",   class: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  MEDIUM: { label: "Medium", class: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  LOW:    { label: "Low",    class: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  NONE:   { label: null,     class: "" },
} as const;

interface TaskCardProps {
  task: TaskWithRelations;
  onClick: (task: TaskWithRelations) => void;
  isOverlay?: boolean;
}

export function TaskCard({ task, onClick, isOverlay }: TaskCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "TASK", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_CONFIG[task.priority];
  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-slate-700/50 bg-slate-800 p-3 shadow-sm",
        "cursor-pointer transition-all hover:border-slate-600 hover:shadow-md",
        isDragging && "opacity-40 ring-2 ring-indigo-500",
        isOverlay && "rotate-2 shadow-2xl ring-2 ring-indigo-500"
      )}
      onClick={() => onClick(task)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-2 hidden cursor-grab touch-none text-slate-600 group-hover:block active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Title */}
      <p className="pr-5 text-sm font-medium leading-snug text-slate-100">
        {task.title}
      </p>

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map(({ label }) => (
            <span
              key={label.id}
              className="inline-block h-1.5 w-8 rounded-full"
              style={{ backgroundColor: `#${label.color}` }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {priority.label && (
            <Badge
              variant="outline"
              className={cn("h-4 px-1.5 text-[10px] font-medium", priority.class)}
            >
              {priority.label}
            </Badge>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-[10px]",
                isOverdue ? "text-red-400" : "text-slate-500"
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              {relativeTime(task.dueDate)}
            </span>
          )}

          {/* GitHub link indicator */}
          {task.githubIssueNumber && (
            <span className="text-[10px] text-slate-500">
              <GitBranch className="inline h-2.5 w-2.5" /> #{task.githubIssueNumber}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <Avatar className="h-5 w-5 flex-shrink-0">
            <AvatarImage
              src={task.assignee.image ?? undefined}
              alt={task.assignee.name ?? ""}
            />
            <AvatarFallback className="bg-indigo-600 text-[8px] text-white">
              {getInitials(task.assignee.name ?? "?")}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}
