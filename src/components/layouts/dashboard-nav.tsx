"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Session } from "next-auth";

const NAV_ITEMS = [
  { href: "/boards", icon: LayoutDashboard, label: "Boards" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

interface DashboardNavProps {
  user: Session["user"];
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delay={0}>
      <nav className="flex w-14 flex-col items-center gap-3 border-r border-slate-800 bg-slate-950 py-4">
        {/* Logo */}
        <Link
          href="/boards"
          className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white transition-transform hover:scale-105"
        >
          D
        </Link>

        {/* Nav items */}
        <div className="flex flex-1 flex-col items-center gap-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Tooltip key={href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={href}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                      )}
                    />
                  }
                >
                  <Icon className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* User avatar + sign out */}
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
                />
              }
            >
              <LogOut className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>

          <Avatar className="h-8 w-8 ring-2 ring-slate-700">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
            <AvatarFallback className="bg-indigo-600 text-xs text-white">
              {getInitials(user.name ?? "?")}
            </AvatarFallback>
          </Avatar>
        </div>
      </nav>
    </TooltipProvider>
  );
}
