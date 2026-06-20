"use client";

import { useState } from "react";
import { GitBranch, CheckCircle, BarChart2, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepoConnectModal } from "@/components/features/github/repo-connect-modal";
import { BoardAnalytics } from "@/components/features/board/board-analytics";
import { relativeTime } from "@/lib/utils";

interface BoardHeaderProps {
  boardId: string;
  name: string;
  color: string;
  description?: string | null;
  githubOwner?: string | null;
  githubRepo?: string | null;
  lastSyncedAt?: Date | string | null;
}

export function BoardHeader({
  boardId,
  name,
  color,
  description,
  githubOwner,
  githubRepo,
  lastSyncedAt,
}: BoardHeaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [syncFlash, setSyncFlash] = useState<{ imported: number } | null>(null);
  const [tab, setTab] = useState<"board" | "analytics">("board");

  const currentRepo =
    githubOwner && githubRepo ? { owner: githubOwner, repo: githubRepo } : null;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
        {/* Color dot + name */}
        <div
          className="h-3 w-3 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h1 className="text-lg font-semibold text-white">{name}</h1>
        {description && (
          <span className="hidden text-sm text-slate-500 sm:block">{description}</span>
        )}

        {/* Tab switcher */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
          <button
            onClick={() => setTab("board")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-colors ${
              tab === "board"
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            Board
          </button>
          <button
            onClick={() => setTab("analytics")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition-colors ${
              tab === "analytics"
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sync flash */}
        {syncFlash && (
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            {syncFlash.imported} issue{syncFlash.imported !== 1 ? "s" : ""} imported
          </span>
        )}

        {/* GitHub badge / connect button */}
        {currentRepo ? (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            <GitBranch className="h-3 w-3 text-indigo-400" />
            {currentRepo.owner}/{currentRepo.repo}
            {lastSyncedAt && (
              <span className="ml-1 text-slate-500">
                · {relativeTime(lastSyncedAt)}
              </span>
            )}
          </button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowModal(true)}
            className="h-7 gap-1.5 border-slate-700 bg-slate-800 text-xs text-slate-400 hover:border-slate-600 hover:text-slate-200"
          >
            <GitBranch className="h-3.5 w-3.5" />
            Connect GitHub
          </Button>
        )}
      </div>

      {/* Analytics panel */}
      {tab === "analytics" && (
        <div className="border-b border-slate-800 bg-slate-950">
          <BoardAnalytics boardId={boardId} />
        </div>
      )}

      <RepoConnectModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSyncFlash(null);
        }}
        boardId={boardId}
        currentRepo={currentRepo}
        onSyncComplete={(result) => {
          setSyncFlash({ imported: result.imported });
          setTimeout(() => setSyncFlash(null), 5000);
        }}
      />
    </>
  );
}
