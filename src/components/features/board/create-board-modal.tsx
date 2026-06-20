"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BOARD_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateBoardModal({ open, onClose, workspaceId }: CreateBoardModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, color, workspaceId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create board");
        return;
      }

      const board = await res.json();
      onClose();
      router.push(`/boards/${board.id}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setName("");
    setDescription("");
    setColor(BOARD_COLORS[0]);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="border-slate-700 bg-slate-900 text-slate-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create a new board</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div
            className="flex h-24 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {name || "Board name"}
          </div>

          {/* Color picker */}
          <div className="flex gap-2">
            {BOARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              >
                {color === c && (
                  <span className="flex h-full w-full items-center justify-center">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 fill-white">
                      <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Board name <span className="text-red-400">*</span>
            </label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 Sprint, Bug Tracker"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
              disabled={isLoading}
              maxLength={60}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">
              Description{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board for?"
              className="border-slate-600 bg-slate-800 text-slate-100 placeholder:text-slate-500"
              disabled={isLoading}
              maxLength={120}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              {isLoading ? "Creating..." : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
