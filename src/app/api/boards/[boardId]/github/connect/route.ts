import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOctokitForUser } from "@/lib/github";

// PATCH /api/boards/[boardId]/github/connect
// Body: { owner: string, repo: string, repoId: string } | { disconnect: true }
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const body = await request.json();

  const board = await prisma.board.findFirst({
    where: { id: boardId, workspace: { ownerId: session.user.id } },
  });

  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (body.disconnect) {
    await prisma.board.update({
      where: { id: boardId },
      data: { githubRepoId: null, githubOwner: null, githubRepo: null, lastSyncedAt: null },
    });
    return NextResponse.json({ success: true });
  }

  const { owner, repo, repoId } = body;
  if (!owner || !repo) {
    return NextResponse.json({ error: "owner and repo are required" }, { status: 400 });
  }

  const updated = await prisma.board.update({
    where: { id: boardId },
    data: { githubRepoId: repoId, githubOwner: owner, githubRepo: repo },
  });

  await prisma.boardActivity.create({
    data: {
      boardId,
      actorId: session.user.id,
      eventType: "GITHUB_ISSUE_LINKED",
      payload: { owner, repo },
    },
  });

  // Register a webhook on the repo so GitHub events flow back to our board
  const webhookUrl = `${process.env.NEXTAUTH_URL}/api/github/webhook`;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (webhookSecret) {
    try {
      const octokit = await getOctokitForUser(session.user.id);
      await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: webhookSecret,
        },
        events: ["issues"],
        active: true,
      });
    } catch {
      // Webhook registration failing shouldn't block the connection
      // (e.g. user may not have admin access to the repo)
    }
  }

  return NextResponse.json(updated);
}
