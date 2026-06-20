import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BoardCanvas } from "@/components/features/board/board-canvas";
import { BoardHeader } from "@/components/features/board/board-header";
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
      <BoardHeader
        boardId={board.id}
        name={board.name}
        color={board.color}
        description={board.description}
        githubOwner={board.githubOwner}
        githubRepo={board.githubRepo}
        lastSyncedAt={board.lastSyncedAt}
      />

      <div className="flex-1 overflow-hidden">
        <BoardCanvas initialBoard={board} />
      </div>
    </div>
  );
}
