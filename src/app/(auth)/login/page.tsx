import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/boards");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo & headline */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold text-white shadow-lg">
              D
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            DevBoard
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            GitHub-integrated Kanban for developers
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 shadow-2xl backdrop-blur-sm">
          <h2 className="mb-6 text-center text-lg font-semibold text-white">
            Sign in to continue
          </h2>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/boards" });
            }}
          >
            <Button
              type="submit"
              className="w-full gap-2 bg-white text-slate-900 hover:bg-slate-100"
              size="lg"
            >
              {/* GitHub SVG icon inline to avoid an extra dependency */}
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-current"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Continue with GitHub
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            We request{" "}
            <code className="rounded bg-slate-700 px-1 py-0.5 text-slate-300">
              repo
            </code>{" "}
            scope to sync your GitHub Issues.
          </p>
        </div>

        <p className="text-center text-xs text-slate-600">
          By signing in you agree to our{" "}
          <span className="text-slate-500">Terms of Service</span> and{" "}
          <span className="text-slate-500">Privacy Policy</span>.
        </p>
      </div>
    </main>
  );
}
