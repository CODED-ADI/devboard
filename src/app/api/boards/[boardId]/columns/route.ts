import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  {params}: {params: Promise<{boardId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Column name is required" }, { status: 400 });
  }

  // Get current max position
  const lastColumn = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = (lastColumn?.position ?? -1) + 1;

  const column = await prisma.column.create({
    data: { name: name.trim(), boardId, position },
    include: { tasks: true },
  });

  await prisma.boardActivity.create({
    data: {
      boardId,
      actorId: session.user.id,
      eventType: "COLUMN_CREATED",
      payload: { name: column.name, position },
    },
  });

  return NextResponse.json(column, { status: 201 });
}
