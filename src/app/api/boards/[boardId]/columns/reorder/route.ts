import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/boards/[boardId]/columns/reorder
// Body: { columnIds: string[] }  — ordered list of column IDs
export async function PATCH(
  request: Request,
  {params}: {params: Promise<{boardId: string}>}
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const { columnIds } = await request.json();

  if (!Array.isArray(columnIds)) {
    return NextResponse.json({ error: "columnIds must be an array" }, { status: 400 });
  }

  // Bulk update positions in a transaction
  await prisma.$transaction(
    columnIds.map((id: string, index: number) =>
      prisma.column.update({
        where: { id },
        data: { position: index },
      })
    )
  );

  await prisma.boardActivity.create({
    data: {
      boardId,
      actorId: session.user.id,
      eventType: "COLUMN_REORDERED",
      payload: { columnIds },
    },
  });

  return NextResponse.json({ success: true });
}
