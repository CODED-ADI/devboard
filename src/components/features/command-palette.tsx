"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Plus,
  GitBranch,
  Settings,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  boards: { id: string; name: string; color: string }[];
}

export function CommandPalette({ boards }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const run = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    []
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-slate-500">
          <div className="flex items-center border-b border-slate-700 px-4">
            <Command.Input
              autoFocus
              placeholder="Search boards, actions..."
              className="h-12 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            {/* Navigation */}
            <Command.Group heading="Navigation">
              <PaletteItem
                icon={<LayoutDashboard className="h-4 w-4" />}
                label="Go to Boards"
                onSelect={() => run(() => router.push("/boards"))}
              />
              <PaletteItem
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                onSelect={() => run(() => router.push("/settings"))}
              />
            </Command.Group>

            {/* Boards */}
            {boards.length > 0 && (
              <Command.Group heading="Your Boards">
                {boards.map((board) => (
                  <PaletteItem
                    key={board.id}
                    icon={
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: board.color }}
                      />
                    }
                    label={board.name}
                    onSelect={() => run(() => router.push(`/boards/${board.id}`))}
                  />
                ))}
              </Command.Group>
            )}

            {/* Actions */}
            <Command.Group heading="Actions">
              <PaletteItem
                icon={<Plus className="h-4 w-4" />}
                label="New Board"
                shortcut="N"
                onSelect={() => {
                  setOpen(false);
                  // Dispatch a custom event that BoardsHeader listens to
                  window.dispatchEvent(new CustomEvent("devboard:new-board"));
                }}
              />
              <PaletteItem
                icon={<GitBranch className="h-4 w-4" />}
                label="Connect GitHub Repo"
                onSelect={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("devboard:connect-github"));
                }}
              />
              <PaletteItem
                icon={<LogOut className="h-4 w-4" />}
                label="Sign out"
                onSelect={() => run(() => signOut({ callbackUrl: "/login" }))}
              />
            </Command.Group>
          </Command.List>

          <div className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-600">
            <span className="mr-3">↑↓ navigate</span>
            <span className="mr-3">↵ select</span>
            <span>ESC close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

interface PaletteItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}

function PaletteItem({ icon, label, shortcut, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300",
        "transition-colors aria-selected:bg-indigo-500/20 aria-selected:text-white"
      )}
    >
      <span className="flex-shrink-0 text-slate-500">{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
