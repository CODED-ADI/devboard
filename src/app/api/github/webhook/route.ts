import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";

// Verify GitHub's HMAC signature to ensure the request is genuine
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // We only care about Issue events
  if (event !== "issues") {
    return NextResponse.json({ ignored: true });
  }

  const payload = JSON.parse(rawBody);
  const { action, issue, repository } = payload;

  if (!["closed", "reopened", "edited", "deleted"].includes(action)) {
    return NextResponse.json({ ignored: true });
  }

  // Find the task linked to this issue
  const task = await prisma.task.findFirst({
    where: {
      githubIssueNumber: issue.number,
      column: {
        board: {
          githubOwner: repository.owner.login,
          githubRepo: repository.name,
        },
      },
    },
    include: {
      column: {
        select: {
          boardId: true,
          board: {
            select: {
              columns: { orderBy: { position: "asc" }, select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ ignored: true, reason: "No linked task found" });
  }

  const boardId = task.column.boardId;
  const columns = task.column.board.columns;

  if (action === "closed") {
    // Move task to the Done column (last column, or one named Done/Complete)
    const doneColumn =
      columns.find((c) => /done|complete|closed|shipped/i.test(c.name)) ??
      columns[columns.length - 1];

    if (doneColumn && doneColumn.id !== task.columnId) {
      const lastPos = await prisma.task.count({ where: { columnId: doneColumn.id } });
      await prisma.task.update({
        where: { id: task.id },
        data: {
          columnId: doneColumn.id,
          position: lastPos,
          status: "DONE",
          completedAt: new Date(),
          syncStatus: "SYNCED",
          lastSyncedAt: new Date(),
        },
      });

      await prisma.boardActivity.create({
        data: {
          boardId,
          taskId: task.id,
          actorId: task.creatorId,
          eventType: "TASK_MOVED",
          payload: { from: task.columnId, to: doneColumn.id, trigger: "github_webhook" },
        },
      });
    }
  } else if (action === "reopened") {
    // Move task back to first column
    const firstColumn = columns[0];
    if (firstColumn && firstColumn.id !== task.columnId) {
      const lastPos = await prisma.task.count({ where: { columnId: firstColumn.id } });
      await prisma.task.update({
        where: { id: task.id },
        data: {
          columnId: firstColumn.id,
          position: lastPos,
          status: "TODO",
          completedAt: null,
          syncStatus: "SYNCED",
          lastSyncedAt: new Date(),
        },
      });

      await prisma.boardActivity.create({
        data: {
          boardId,
          taskId: task.id,
          actorId: task.creatorId,
          eventType: "TASK_REOPENED",
          payload: { trigger: "github_webhook" },
        },
      });
    }
  } else if (action === "edited") {
    // Sync title and body changes from GitHub back to the task
    const updates: Record<string, string> = {};
    if (issue.title && issue.title !== task.title) updates.title = issue.title;
    if (issue.body !== task.description) updates.description = issue.body ?? "";

    if (Object.keys(updates).length > 0) {
      await prisma.task.update({
        where: { id: task.id },
        data: { ...updates, syncStatus: "SYNCED", lastSyncedAt: new Date() },
      });

      await prisma.boardActivity.create({
        data: {
          boardId,
          taskId: task.id,
          actorId: task.creatorId,
          eventType: "TASK_UPDATED",
          payload: { ...updates, trigger: "github_webhook" },
        },
      });
    }
  } else if (action === "deleted") {
    await prisma.task.update({
      where: { id: task.id },
      data: { githubIssueNumber: null, githubIssueNodeId: null, syncStatus: "UNSYNCED" },
    });
  }

  return NextResponse.json({ success: true, action });
}
