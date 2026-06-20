"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Lock, Star, RefreshCw, Unlink, Download } from "lucide-react";
import type { GitHubRepo } from "@/lib/github";

interface RepoConnectModalProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
  currentRepo?: { owner: string; repo: string } | null;
  onSyncComplete?: (result: { imported: number; skipped: number }) => void;
}

export function RepoConnectModal({
  open,
  onClose,
  boardId,
  currentRepo,
  onSyncComplete,
}: RepoConnectModalProps) {
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [filtered, setFiltered] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) fetchRepos();
  }, [open]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(repos.filter((r) => r.nameWithOwner.toLowerCase().includes(q)));
  }, [search, repos]);

  const fetchRepos = async () => {
    setIsLoadingRepos(true);
    setError("");
    try {
      const res = await fetch("/api/github/repos");
      if (!res.ok) throw new Error("Failed to load repos");
      const data = await res.json();
      setRepos(data);
      setFiltered(data);
    } catch {
      setError("Could not load your repositories. Check your GitHub permissions.");
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const connectRepo = async (repo: GitHubRepo) => {
    setIsConnecting(true);
    setError("");
    const [owner, name] = repo.nameWithOwner.split("/");
    try {
      const res = await fetch(`/api/boards/${boardId}/github/connect`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo: name, repoId: repo.id }),
      });
      if (!res.ok) throw new Error("Failed to connect");
      router.refresh();
      setSyncResult(null);
    } catch {
      setError("Failed to connect repository.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectRepo = async () => {
    if (!confirm("Disconnect this repository? Existing synced tasks will remain.")) return;
    setIsConnecting(true);
    try {
      await fetch(`/api/boards/${boardId}/github/connect`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disconnect: true }),
      });
      router.refresh();
      onClose();
    } finally {
      setIsConnecting(false);
    }
  };

  const importIssues = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    setError("");
    try {
      const res = await fetch(`/api/boards/${boardId}/github/sync`, { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const result = await res.json();
      setSyncResult(result);
      onSyncComplete?.(result);
      router.refresh();
    } catch {
      setError("Failed to import issues. Try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-slate-700 bg-slate-900 text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <GitBranch className="h-5 w-5 text-indigo-400" />
            GitHub Repository
          </DialogTitle>
        </DialogHeader>

        {/* Currently connected */}
        {currentRepo && (
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">
                  Connected
                </p>
                <p className="mt-1 font-semibold text-white">
                  {currentRepo.owner}/{currentRepo.repo}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={disconnectRepo}
                disabled={isConnecting}
                className="text-slate-500 hover:text-red-400"
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>

            {/* Import Issues */}
            <div className="mt-4 border-t border-indigo-500/20 pt-4">
              <Button
                onClick={importIssues}
                disabled={isSyncing}
                className="w-full gap-2 bg-indigo-500 hover:bg-indigo-600"
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isSyncing ? "Importing Issues..." : "Import GitHub Issues"}
              </Button>

              {syncResult && (
                <div className="mt-3 rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
                  ✓ Imported <strong>{syncResult.imported}</strong> issue
                  {syncResult.imported !== 1 ? "s" : ""}.
                  {syncResult.skipped > 0 && ` ${syncResult.skipped} already synced.`}
                </div>
              )}

              <p className="mt-2 text-xs text-slate-500">
                Open issues are imported into the first column. Already-synced issues are skipped.
              </p>
            </div>
          </div>
        )}

        {/* Repo picker */}
        {!currentRepo && (
          <div className="space-y-3">
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-700/50 bg-slate-800/50">
              {isLoadingRepos ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {search ? "No repos match your search" : "No repositories found"}
                </p>
              ) : (
                filtered.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => connectRepo(repo)}
                    disabled={isConnecting}
                    className="flex w-full items-center justify-between gap-3 border-b border-slate-700/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-700/50 disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-200">
                          {repo.nameWithOwner}
                        </span>
                        {repo.isPrivate && (
                          <Lock className="h-3 w-3 flex-shrink-0 text-slate-500" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 text-xs text-slate-500">
                      <Star className="h-3 w-3" />
                      {repo.stargazerCount}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* If connected, also show option to switch */}
        {currentRepo && (
          <details className="text-sm">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-300">
              Switch to a different repository
            </summary>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
              />
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-700/50">
                {isLoadingRepos ? (
                  <div className="py-6 text-center">
                    <RefreshCw className="mx-auto h-4 w-4 animate-spin text-slate-500" />
                  </div>
                ) : (
                  filtered.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => connectRepo(repo)}
                      disabled={isConnecting}
                      className="flex w-full items-center gap-2 border-b border-slate-700/50 px-3 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-slate-700/50"
                    >
                      {repo.isPrivate && <Lock className="h-3 w-3 flex-shrink-0 text-slate-500" />}
                      <span className="truncate text-slate-300">{repo.nameWithOwner}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </details>
        )}

        {error && !currentRepo && <p className="text-sm text-red-400">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
