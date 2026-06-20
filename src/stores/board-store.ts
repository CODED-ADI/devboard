import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { BoardWithColumns, ColumnWithTasks, TaskWithRelations } from "@/types";

interface BoardState {
  // Active board data
  board: BoardWithColumns | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  activeTaskId: string | null;      // task currently open in detail modal
  activeColumnId: string | null;    // column being dragged
  isDragging: boolean;

  // Actions
  setBoard: (board: BoardWithColumns) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Optimistic task movement (updates local state before API confirms)
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string, newPosition: number) => void;

  // Optimistic column reorder
  reorderColumns: (columnIds: string[]) => void;

  // Task CRUD (optimistic)
  addTask: (columnId: string, task: TaskWithRelations) => void;
  updateTask: (taskId: string, updates: Partial<TaskWithRelations>) => void;
  removeTask: (taskId: string) => void;

  // UI actions
  openTask: (taskId: string) => void;
  closeTask: () => void;
  setDragging: (isDragging: boolean, columnId?: string) => void;
}

export const useBoardStore = create<BoardState>()(
  devtools(
    subscribeWithSelector((set) => ({
      board: null,
      isLoading: false,
      error: null,
      activeTaskId: null,
      activeColumnId: null,
      isDragging: false,

      setBoard: (board) => set({ board, isLoading: false, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      moveTask: (taskId, fromColumnId, toColumnId, newPosition) =>
        set((state) => {
          if (!state.board) return state;

          const columns = state.board.columns.map((col): ColumnWithTasks => {
            // Remove task from source column
            if (col.id === fromColumnId) {
              return {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== taskId),
              };
            }

            // Insert task into destination column at new position
            if (col.id === toColumnId) {
              const task = state.board!.columns
                .flatMap((c) => c.tasks)
                .find((t) => t.id === taskId);

              if (!task) return col;

              const updatedTask = { ...task, columnId: toColumnId, position: newPosition };
              const tasks = [...col.tasks];
              tasks.splice(newPosition, 0, updatedTask);

              // Re-assign positions to be sequential
              return {
                ...col,
                tasks: tasks.map((t, i) => ({ ...t, position: i })),
              };
            }

            return col;
          });

          return { board: { ...state.board!, columns } };
        }),

      reorderColumns: (columnIds) =>
        set((state) => {
          if (!state.board) return state;

          const columnMap = new Map(state.board.columns.map((c) => [c.id, c]));
          const columns = columnIds
            .map((id, index) => {
              const col = columnMap.get(id);
              return col ? { ...col, position: index } : null;
            })
            .filter(Boolean) as ColumnWithTasks[];

          return { board: { ...state.board!, columns } };
        }),

      addTask: (columnId, task) =>
        set((state) => {
          if (!state.board) return state;

          const columns = state.board.columns.map((col) =>
            col.id === columnId
              ? { ...col, tasks: [...col.tasks, task] }
              : col
          );

          return { board: { ...state.board!, columns } };
        }),

      updateTask: (taskId, updates) =>
        set((state) => {
          if (!state.board) return state;

          const columns = state.board.columns.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) =>
              t.id === taskId ? { ...t, ...updates } : t
            ),
          }));

          return { board: { ...state.board!, columns } };
        }),

      removeTask: (taskId) =>
        set((state) => {
          if (!state.board) return state;

          const columns = state.board.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          }));

          return { board: { ...state.board!, columns } };
        }),

      openTask: (taskId) => set({ activeTaskId: taskId }),
      closeTask: () => set({ activeTaskId: null }),
      setDragging: (isDragging, columnId) =>
        set({ isDragging, activeColumnId: columnId ?? null }),
    })),
    { name: "board-store" }
  )
);
