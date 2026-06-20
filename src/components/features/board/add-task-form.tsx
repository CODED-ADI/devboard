"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface AddTaskFormProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AddTaskForm({ onAdd, onCancel, isLoading }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        className="border-slate-600 bg-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500"
        disabled={isLoading}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="h-7 bg-indigo-500 text-xs hover:bg-indigo-600"
          disabled={!title.trim() || isLoading}
        >
          Add task
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-slate-400 hover:text-slate-200"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </form>
  );
}
