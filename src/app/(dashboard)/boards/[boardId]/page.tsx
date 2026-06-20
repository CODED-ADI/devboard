import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardCanvas } from "@/components/features/board/board-canvas";
import type { Metadata } from "next";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export async function generateMetadata({ params }: BoardPageProps): Promise<Metadata> {
  const { boardId } = await params;
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { name: true },
  });
  return { title: board?.name ?? "Board" };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { boardId } = await params;

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      workspace: { ownerId: session.user.id },
    },
    include: {
      labels: true,
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignee: { select: { id: true, name: true, image: true } },
              labels: { include: { label: true } },
            },
          },
        },
      },
    },
  });

  if (!board) notFound();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Board header */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-4">
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: board.color }}
        />
        <h1 className="text-lg font-semibold text-white">{board.name}</h1>
        {board.description && (
          <span className="text-sm text-slate-400">{board.description}</span>
        )}
        {board.githubRepo && (
          <span className="ml-auto text-xs text-slate-500">
            {board.githubOwner}/{board.githubRepo}
          </span>
        )}
      </div>

      {/* Kanban canvas — client component with dnd-kit */}
      <div className="flex-1 overflow-hidden">
        <BoardCanvas initialBoard={board} />
      </div>
    </div>
  );
}
