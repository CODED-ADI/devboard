import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "@/components/layouts/dashboard-nav";
import { CommandPalette } from "@/components/features/command-palette";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const boards = await prisma.board.findMany({
    where: {
      workspace: { ownerId: session.user.id },
      isArchived: false,
    },
    select: { id: true, name: true, color: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <DashboardNav user={session.user} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      <CommandPalette boards={boards} />
    </div>
  );
}
