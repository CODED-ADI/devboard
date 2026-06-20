import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: session.user.id },
    include: {
      boards: {
        where: { isArchived: false },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return NextResponse.json(workspace?.boards ?? []);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, color, workspaceId } = body;

  if (!name?.trim() || !workspaceId) {
    return NextResponse.json(
      { error: "name and workspaceId are required" },
      { status: 400 }
    );
  }

  // Verify the user owns this workspace
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: session.user.id },
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const board = await prisma.board.create({
    data: {
      name: name.trim(),
      description: description?.trim() ?? null,
      color: color ?? "#6366f1",
      workspaceId,
      columns: {
        createMany: {
          data: [
            { name: "To Do", position: 0 },
            { name: "In Progress", position: 1 },
            { name: "Done", position: 2 },
          ],
        },
      },
    },
    include: {
      columns: { orderBy: { position: "asc" } },
      labels: true,
    },
  });

  await prisma.boardActivity.create({
    data: {
      boardId: board.id,
      actorId: session.user.id,
      eventType: "BOARD_CREATED",
      payload: { name: board.name, color: board.color },
    },
  });

  return NextResponse.json(board, { status: 201 });
}
