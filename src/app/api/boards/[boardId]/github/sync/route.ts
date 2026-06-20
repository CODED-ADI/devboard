import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRepoIssues } from "@/lib/github";

// POST /api/boards/[boardId]/github/sync
// Imports open GitHub Issues as tasks into the first column of the board.
// Already-synced issues (matched by githubIssueNumber) are skipped.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspace: { ownerId: session.user.id } },
    include: {
      columns: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (!board.githubOwner || !board.githubRepo) {
    return NextResponse.json(
      { error: "Board is not connected to a GitHub repository" },
      { status: 400 }
    );
  }

  const targetColumn = board.columns[0];
  if (!targetColumn) {
    return NextResponse.json({ error: "Board has no columns" }, { status: 400 });
  }

  // Fetch open issues from GitHub
  const issues = await getRepoIssues(
    session.user.id,
    board.githubOwner,
    board.githubRepo
  );

  // Get existing synced issue numbers so we don't duplicate
  const existing = await prisma.task.findMany({
    where: { column: { boardId }, githubIssueNumber: { not: null } },
    select: { githubIssueNumber: true },
  });
  const existingNumbers = new Set(existing.map((t) => t.githubIssueNumber));

  // Get current max position in target column
  const lastTask = await prisma.task.findFirst({
    where: { columnId: targetColumn.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let position = (lastTask?.position ?? -1) + 1;

  const created: string[] = [];

  for (const issue of issues) {
    if (existingNumbers.has(issue.number)) continue;

    // Ensure labels exist on the board
    const labelConnections: { label: { connectOrCreate: { where: { boardId_name: { boardId: string; name: string } }; create: { name: string; color: string; boardId: string } } } }[] = [];

    for (const ghLabel of issue.labels.nodes) {
      labelConnections.push({
        label: {
          connectOrCreate: {
            where: { boardId_name: { boardId, name: ghLabel.name } },
            create: { name: ghLabel.name, color: ghLabel.color, boardId },
          },
        },
      });
    }

    const task = await prisma.task.create({
      data: {
        title: issue.title,
        description: issue.body ?? null,
        columnId: targetColumn.id,
        position,
        creatorId: session.user.id,
        githubIssueNumber: issue.number,
        githubIssueNodeId: issue.id,
        githubIssueUrl: issue.url,
        syncStatus: "SYNCED",
        lastSyncedAt: new Date(),
        labels: { create: labelConnections },
      },
    });

    created.push(task.id);
    position++;
  }

  // Update board lastSyncedAt
  await prisma.board.update({
    where: { id: boardId },
    data: { lastSyncedAt: new Date() },
  });

  await prisma.boardActivity.create({
    data: {
      boardId,
      actorId: session.user.id,
      eventType: "GITHUB_ISSUE_SYNCED",
      payload: { imported: created.length, skipped: issues.length - created.length },
    },
  });

  return NextResponse.json({
    imported: created.length,
    skipped: issues.length - created.length,
    total: issues.length,
  });
}
