"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { BoardWithColumns, TaskWithRelations } from "@/types";

// ─── Query keys ───────────────────────────────────────────

export const boardKeys = {
  all: ["boards"] as const,
  detail: (boardId: string) => ["boards", boardId] as const,
};

// ─── Fetch board ──────────────────────────────────────────

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async (): Promise<BoardWithColumns> => {
      const res = await fetch(`/api/boards/${boardId}`);
      if (!res.ok) throw new Error("Failed to fetch board");
      return res.json();
    },
  });
}

// ─── Create task ──────────────────────────────────────────

interface CreateTaskInput {
  title: string;
  columnId: string;
  boardId: string;
  priority?: string;
  description?: string;
}

export function useCreateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskInput): Promise<TaskWithRelations> => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

// ─── Update task ──────────────────────────────────────────

interface UpdateTaskInput {
  taskId: string;
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
  assigneeId?: string | null;
}

export function useUpdateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, ...data }: UpdateTaskInput) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

// ─── Delete task ──────────────────────────────────────────

export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

// ─── Move task (persists drag result) ─────────────────────

interface MoveTaskInput {
  taskId: string;
  toColumnId: string;
  position: number;
}

export function useMoveTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, ...data }: MoveTaskInput) => {
      const res = await fetch(`/api/tasks/${taskId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to move task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

// ─── Create column ────────────────────────────────────────

export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create column");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}

// ─── Reorder columns ──────────────────────────────────────

export function useReorderColumns(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columnIds: string[]) => {
      const res = await fetch(`/api/boards/${boardId}/columns/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnIds }),
      });
      if (!res.ok) throw new Error("Failed to reorder columns");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}
