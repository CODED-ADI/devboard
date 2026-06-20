import { Octokit } from "@octokit/rest";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated Octokit factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns an Octokit instance authenticated with the stored GitHub access token
 * for a given internal user ID. Throws if the user has no linked GitHub account.
 */
export async function getOctokitForUser(userId: string): Promise<Octokit> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    throw new Error(
      `No GitHub access token found for user ${userId}. Ask them to re-authenticate.`
    );
  }

  return new Octokit({ auth: account.access_token });
}

/**
 * Reads the current session and returns an authenticated Octokit.
 * Use this in Server Components and Route Handlers.
 */
export async function getAuthenticatedOctokit(): Promise<Octokit> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthenticated — no active session.");
  }

  return getOctokitForUser(session.user.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// GraphQL helper (for queries that need the GitHub GraphQL API)
// ─────────────────────────────────────────────────────────────────────────────

export async function githubGraphQL<T>(
  userId: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    throw new Error(`No GitHub access token found for user ${userId}.`);
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    // Next.js fetch cache: revalidate GitHub data every 60 seconds
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL request failed: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(
      `GitHub GraphQL errors: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`
    );
  }

  return json.data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed GitHub query helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface GitHubRepo {
  id: string;
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  isPrivate: boolean;
  stargazerCount: number;
  updatedAt: string;
}

/** Fetch the first 50 repos the authenticated user has access to. */
export async function getUserRepos(userId: string): Promise<GitHubRepo[]> {
  const data = await githubGraphQL<{
    viewer: { repositories: { nodes: GitHubRepo[] } };
  }>(
    userId,
    `query GetUserRepos {
      viewer {
        repositories(first: 50, orderBy: { field: UPDATED_AT, direction: DESC }, ownerAffiliations: [OWNER, COLLABORATOR]) {
          nodes {
            id
            name
            nameWithOwner
            description
            url
            isPrivate
            stargazerCount
            updatedAt
          }
        }
      }
    }`
  );

  return data.viewer.repositories.nodes;
}

export interface GitHubIssue {
  number: number;
  id: string;
  title: string;
  body: string | null;
  url: string;
  state: "OPEN" | "CLOSED";
  labels: { nodes: { name: string; color: string }[] };
  assignees: { nodes: { login: string; avatarUrl: string }[] };
  createdAt: string;
  updatedAt: string;
}

/** Fetch open issues for a specific repo. */
export async function getRepoIssues(
  userId: string,
  owner: string,
  repo: string,
  first = 50
): Promise<GitHubIssue[]> {
  const data = await githubGraphQL<{
    repository: { issues: { nodes: GitHubIssue[] } };
  }>(
    userId,
    `query GetRepoIssues($owner: String!, $repo: String!, $first: Int!) {
      repository(owner: $owner, name: $repo) {
        issues(first: $first, states: [OPEN], orderBy: { field: UPDATED_AT, direction: DESC }) {
          nodes {
            number
            id
            title
            body
            url
            state
            labels(first: 10) {
              nodes { name color }
            }
            assignees(first: 5) {
              nodes { login avatarUrl }
            }
            createdAt
            updatedAt
          }
        }
      }
    }`,
    { owner, repo, first }
  );

  return data.repository.issues.nodes;
}

/** Create a GitHub issue and return its number and node ID. */
export async function createGitHubIssue(
  userId: string,
  owner: string,
  repo: string,
  title: string,
  body?: string
): Promise<{ number: number; nodeId: string; url: string }> {
  const octokit = await getOctokitForUser(userId);

  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
  });

  return { number: data.number, nodeId: data.node_id, url: data.html_url };
}

/** Update an existing GitHub issue's title and/or body. */
export async function updateGitHubIssue(
  userId: string,
  owner: string,
  repo: string,
  issueNumber: number,
  updates: { title?: string; body?: string; state?: "open" | "closed" }
): Promise<void> {
  const octokit = await getOctokitForUser(userId);

  await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    ...updates,
  });
}
