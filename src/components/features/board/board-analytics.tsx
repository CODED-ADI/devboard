"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, CheckCircle, GitBranch, LayoutDashboard } from "lucide-react";

interface AnalyticsData {
  data: { date: string; label: string; completed: number; moved: number }[];
  totalTasks: number;
  doneTasks: number;
  syncedTasks: number;
}

interface BoardAnalyticsProps {
  boardId: string;
}

export function BoardAnalytics({ boardId }: BoardAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch(`/api/boards/${boardId}/analytics`)
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => {});
  }, [boardId]);

  if (!analytics) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-600 text-sm">
        Loading analytics...
      </div>
    );
  }

  const completionRate =
    analytics.totalTasks > 0
      ? Math.round((analytics.doneTasks / analytics.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<LayoutDashboard className="h-4 w-4" />}
          label="Total Tasks"
          value={analytics.totalTasks}
          color="text-indigo-400"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="Completion"
          value={`${completionRate}%`}
          sub={`${analytics.doneTasks} done`}
          color="text-green-400"
        />
        <StatCard
          icon={<GitBranch className="h-4 w-4" />}
          label="GitHub Synced"
          value={analytics.syncedTasks}
          color="text-blue-400"
        />
      </div>

      {/* Velocity chart */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-300">
            Activity — last 14 days
          </h3>
        </div>

        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="grad-moved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-completed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#475569" }}
                interval={2}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                cursor={{ stroke: "#334155" }}
              />
              <Area
                type="monotone"
                dataKey="moved"
                name="Tasks moved"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#grad-moved)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                name="Completed"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#grad-completed)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
            Tasks moved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Completed
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className={`mb-2 ${color}`}>{icon}</div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-[10px] text-slate-600">{sub}</p>}
    </div>
  );
}
