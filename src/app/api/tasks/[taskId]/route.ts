import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  {params}: {params: Promise<{taskId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await request.json();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && {
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
    },
  });

  // Log the update
  const column = await prisma.column.findUnique({
    where: { id: task.columnId },
    select: { boardId: true },
  });

  if (column) {
    await prisma.boardActivity.create({
      data: {
        boardId: column.boardId,
        taskId,
        actorId: session.user.id,
        eventType: "TASK_UPDATED",
        payload: body,
      },
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(
  _req: Request,
  {params}: {params: Promise<{taskId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: { select: { boardId: true } } },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.task.delete({ where: { id: taskId } });

  await prisma.boardActivity.create({
    data: {
      boardId: task.column.boardId,
      actorId: session.user.id,
      eventType: "TASK_DELETED",
      payload: { title: task.title },
    },
  });

  return NextResponse.json({ success: true });
}
