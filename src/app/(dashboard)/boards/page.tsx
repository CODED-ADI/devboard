import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Boards",
};

export default async function BoardsPage() {
  const session = await auth();

  // Find (or lazily create) a default personal workspace for this user.
  // In a real flow this would be done at sign-up time via a post-auth hook.
  let workspace = await prisma.workspace.findFirst({
    where: {
      ownerId: session!.user.id,
    },
    include: {
      boards: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: `${session!.user.name ?? "My"}'s Workspace`,
        slug: `personal-${session!.user.id.slice(0, 8)}`,
        ownerId: session!.user.id,
        members: {
          create: {
            userId: session!.user.id,
            role: "OWNER",
          },
        },
      },
      include: { boards: true },
    });
  }

  const boards = workspace.boards;

  return (
    <div className="flex flex-1 flex-col overflow-auto p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Boards</h1>
          <p className="mt-1 text-sm text-slate-400">
            {boards.length} board{boards.length !== 1 ? "s" : ""} in{" "}
            {workspace.name}
          </p>
        </div>
        <Button className="gap-2 bg-indigo-500 hover:bg-indigo-600">
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      {/* Board grid */}
      {boards.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-700 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
            <Plus className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              No boards yet
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Create your first board to start tracking work
            </p>
          </div>
          <Button className="gap-2 bg-indigo-500 hover:bg-indigo-600">
            <Plus className="h-4 w-4" />
            Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-5 transition-all hover:border-slate-600 hover:bg-slate-800"
            >
              {/* Color accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
                style={{ backgroundColor: board.color }}
              />
              <div className="mt-2">
                <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {board.name}
                </h3>
                {board.description && (
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                    {board.description}
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                {board.githubRepo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current" aria-hidden="true">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    {board.githubOwner}/{board.githubRepo}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
