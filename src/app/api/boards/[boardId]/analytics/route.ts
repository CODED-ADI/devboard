import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/boards/[boardId]/analytics
// Returns tasks-completed-per-day for the last 14 days
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const events = await prisma.boardActivity.findMany({
    where: {
      boardId,
      eventType: { in: ["TASK_COMPLETED", "TASK_MOVED"] },
      occurredAt: { gte: since },
    },
    select: { occurredAt: true, eventType: true, payload: true },
    orderBy: { occurredAt: "asc" },
  });

  // Count tasks completed per day
  const byDay: Record<string, { completed: number; moved: number }> = {};

  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay[key] = { completed: 0, moved: 0 };
  }

  for (const event of events) {
    const key = event.occurredAt.toISOString().slice(0, 10);
    if (!byDay[key]) continue;

    if (event.eventType === "TASK_COMPLETED") {
      byDay[key].completed++;
    } else if (event.eventType === "TASK_MOVED") {
      byDay[key].moved++;
    }
  }

  const data = Object.entries(byDay).map(([date, counts]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...counts,
  }));

  // Summary stats
  const totalTasks = await prisma.task.count({
    where: { column: { boardId } },
  });
  const doneTasks = await prisma.task.count({
    where: { column: { boardId }, status: "DONE" },
  });
  const syncedTasks = await prisma.task.count({
    where: { column: { boardId }, syncStatus: "SYNCED" },
  });

  return NextResponse.json({ data, totalTasks, doneTasks, syncedTasks });
}
