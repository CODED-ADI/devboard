import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, githubUsername: true, image: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Manage your account and preferences.</p>

      <div className="mt-8 space-y-6">
        {/* Profile card */}
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Profile
          </h2>
          <div className="flex items-center gap-4">
            {user?.image && (
              <img
                src={user.image}
                alt={user.name ?? "Avatar"}
                className="h-14 w-14 rounded-full ring-2 ring-slate-700"
              />
            )}
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
              {user?.githubUsername && (
                <p className="text-xs text-slate-500">@{user.githubUsername}</p>
              )}
            </div>
          </div>
        </section>

        {/* Account info */}
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Account
          </h2>
          <div className="space-y-3 text-sm">
            <Row label="Authentication" value="GitHub OAuth" />
            <Row
              label="Member since"
              value={user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            />
          </div>
        </section>

        {/* Keyboard shortcuts */}
        <section className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Keyboard Shortcuts
          </h2>
          <div className="space-y-2 text-sm">
            <ShortcutRow keys={["⌘", "K"]} label="Open command palette" />
            <ShortcutRow keys={["ESC"]} label="Close modal / palette" />
            <ShortcutRow keys={["Enter"]} label="Confirm inline form" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200">{value}</span>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <div className="flex gap-1">
        {keys.map((k) => (
          <kbd
            key={k}
            className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
