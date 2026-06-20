import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  {params}: {params: Promise<{boardId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  return NextResponse.json(board);
}

export async function PATCH(
  request: Request,
  {params}: {params: Promise<{boardId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const body = await request.json();

  const board = await prisma.board.update({
    where: { id: boardId },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.color && { color: body.color }),
    },
  });

  await prisma.boardActivity.create({
    data: {
      boardId,
      actorId: session.user.id,
      eventType: "BOARD_UPDATED",
      payload: body,
    },
  });

  return NextResponse.json(board);
}
