import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    include: { column: { select: { boardId: true } } },
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

  return NextResponse.json({ success: true });
}
