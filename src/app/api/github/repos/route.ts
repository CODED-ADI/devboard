import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRepos } from "@/lib/github";

// GET /api/github/repos
// Returns repos the authenticated user has access to.
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await getUserRepos(session.user.id);
    return NextResponse.json(repos);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch repositories. Make sure your GitHub token has the repo scope." },
      { status: 500 }
    );
  }
}
