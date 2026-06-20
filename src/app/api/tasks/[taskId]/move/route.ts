import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateGitHubIssue } from "@/lib/github";

// PATCH /api/tasks/[taskId]/move
// Body: { toColumnId: string, position: number }
export async function PATCH(
  request: Request,
  {params}: {params: Promise<{taskId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const { toColumnId, position } = await request.json();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      column: { select: { boardId: true } },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const fromColumnId = task.columnId;

  // Run the move and re-sequencing in a transaction
  await prisma.$transaction(async (tx) => {
    // Shift tasks in destination column to make room
    await tx.task.updateMany({
      where: { columnId: toColumnId, position: { gte: position }, id: { not: taskId } },
      data: { position: { increment: 1 } },
    });

    // Move the task
    await tx.task.update({
      where: { id: taskId },
      data: { columnId: toColumnId, position },
    });

    // Compact source column positions to remove gaps
    const remaining = await tx.task.findMany({
      where: { columnId: fromColumnId, id: { not: taskId } },
      orderBy: { position: "asc" },
    });

    await Promise.all(
      remaining.map((t, i) =>
        tx.task.update({ where: { id: t.id }, data: { position: i } })
      )
    );
  });

  await prisma.boardActivity.create({
    data: {
      boardId: task.column.boardId,
      taskId,
      actorId: session.user.id,
      eventType: "TASK_MOVED",
      payload: { from: fromColumnId, to: toColumnId, position },
    },
  });

  // ── Two-way GitHub sync ────────────────────────────────────────────────────
  // If this task is linked to a GitHub Issue, sync the state change.
  if (task.githubIssueNumber) {
    const board = await prisma.board.findFirst({
      where: { id: task.column.boardId, githubOwner: { not: null } },
      select: { githubOwner: true, githubRepo: true },
    });

    if (board?.githubOwner && board?.githubRepo) {
      const destColumn = await prisma.column.findUnique({
        where: { id: toColumnId },
        select: { name: true },
      });

      const isDone = /done|complete|closed|shipped/i.test(destColumn?.name ?? "");
      const wasUndone = /done|complete|closed|shipped/i.test(
        (await prisma.column.findUnique({ where: { id: fromColumnId }, select: { name: true } }))?.name ?? ""
      );

      // Only call GitHub API when state actually changes
      if (isDone || wasUndone) {
        await updateGitHubIssue(
          session.user.id,
          board.githubOwner,
          board.githubRepo,
          task.githubIssueNumber,
          { state: isDone ? "closed" : "open" }
        ).catch(() => {
          // Don't fail the move if GitHub sync fails
        });

        await prisma.task.update({
          where: { id: taskId },
          data: { syncStatus: "SYNCED", lastSyncedAt: new Date() },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
