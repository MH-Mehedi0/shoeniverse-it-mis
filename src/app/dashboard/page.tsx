"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { STATUS_META } from "@/types";

interface Stats {
  totalComplaints: number;
  statusCounts: Record<string, number>;
  totalUsers: number | null;
  activeUsers: number | null;
  byDepartment: { department: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

const STATUS_ORDER = ["PENDING", "DEVICE_COLLECTED", "ON_PROCESS", "DONE", "CANCELLED"];
const PIE_COLORS = ["#eab308", "#3b82f6", "#f97316", "#22c55e", "#ef4444"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  }
  if (!stats) {
    return <div className="text-sm text-red-600">Could not load dashboard statistics.</div>;
  }

  const cards = [
    { label: "Total Complaints", value: stats.totalComplaints },
    { label: "Pending", value: stats.statusCounts.PENDING },
    { label: "Device Collected / Allocated", value: stats.statusCounts.DEVICE_COLLECTED },
    { label: "On Process", value: stats.statusCounts.ON_PROCESS },
    { label: "Done", value: stats.statusCounts.DONE },
    { label: "Cancelled", value: stats.statusCounts.CANCELLED },
    ...(stats.totalUsers !== null ? [{ label: "Total Users", value: stats.totalUsers }] : []),
    ...(stats.activeUsers !== null ? [{ label: "Active Users", value: stats.activeUsers }] : []),
  ];

  const pieData = STATUS_ORDER.map((s) => ({ name: STATUS_META[s].label, value: stats.statusCounts[s] }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Live overview, computed from the database.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-2xl font-semibold text-slate-900">{c.value}</div>
            <div className="mt-1 text-xs font-medium text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Complaint status distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={48} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Complaints by department</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0f6bd8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Complaints by month (last 6 months)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byMonth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
