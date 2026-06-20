"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, GitBranch, ExternalLink } from "lucide-react";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-board";
import type { TaskWithRelations } from "@/types";
import { cn } from "@/lib/utils";

const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"] as const;

const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30",
  HIGH:   "bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30",
  LOW:    "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
  NONE:   "bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600",
};

interface TaskModalProps {
  task: TaskWithRelations;
  boardId: string;
  onClose: () => void;
}

export function TaskModal({ task, boardId, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState(task.priority);
  const [isDirty, setIsDirty] = useState(false);

  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);

  const markDirty = () => setIsDirty(true);

  const handleSave = async () => {
    if (!isDirty) return;
    await updateTask.mutateAsync({
      taskId: task.id,
      title: title.trim(),
      description: description.trim() || null,
      priority,
    } as Parameters<typeof updateTask.mutateAsync>[0]);
    setIsDirty(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask.mutateAsync(task.id);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="border-slate-700 bg-slate-900 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Task details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            className="border-0 bg-transparent px-0 text-lg font-semibold text-white placeholder:text-slate-500 focus-visible:ring-0"
            placeholder="Task title"
          />

          {/* Priority */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Priority
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPriority(p); markDirty(); }}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    PRIORITY_STYLES[p],
                    priority === p && "ring-2 ring-offset-1 ring-offset-slate-900 ring-current"
                  )}
                >
                  {p === "NONE" ? "No priority" : p.charAt(0) + p.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Description
            </p>
            <Textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              placeholder="Add a description..."
              rows={4}
              className="resize-none border-slate-700 bg-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500"
            />
          </div>

          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Labels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map(({ label }) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="border-0 text-xs"
                    style={{
                      backgroundColor: `#${label.color}33`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* GitHub link */}
          {task.githubIssueUrl && (
            <a
              href={task.githubIssueUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              <GitBranch className="h-4 w-4" />
              <span>GitHub Issue #{task.githubIssueNumber}</span>
              <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-500" />
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              {isDirty ? "Discard" : "Close"}
            </Button>
            {isDirty && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateTask.isPending || !title.trim()}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                {updateTask.isPending ? "Saving..." : "Save changes"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
