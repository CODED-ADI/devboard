import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, columnId, priority, boardId } = body;

  if (!title?.trim() || !columnId) {
    return NextResponse.json(
      { error: "title and columnId are required" },
      { status: 400 }
    );
  }

  // Get the next position in this column
  const lastTask = await prisma.task.findFirst({
    where: { columnId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = (lastTask?.position ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() ?? null,
      columnId,
      position,
      priority: priority ?? "MEDIUM",
      creatorId: session.user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, image: true } },
      labels: { include: { label: true } },
    },
  });

  if (boardId) {
    await prisma.boardActivity.create({
      data: {
        boardId,
        taskId: task.id,
        actorId: session.user.id,
        eventType: "TASK_CREATED",
        payload: { title: task.title, columnId, priority: task.priority },
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
