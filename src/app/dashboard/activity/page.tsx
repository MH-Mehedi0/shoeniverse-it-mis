"use client";

import { useEffect, useState, useCallback } from "react";

interface LogRow {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
  ipAddress: string | null;
  user: { fullName: string; userId: string } | null;
  relatedComplaint: { ticketId: string } | null;
}

const ACTIONS = [
  "LOGIN", "LOGOUT", "LOGIN_FAILED", "COMPLAINT_CREATED", "COMPLAINT_UPDATED",
  "COMPLAINT_STATUS_CHANGED", "USER_CREATED", "USER_UPDATED", "USER_DEACTIVATED",
  "USER_REACTIVATED", "PASSWORD_CHANGED",
];

export default function ActivityLogPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    params.set("page", String(page));
    fetch(`/api/activity?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [action, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Activity Logs</h1>
        <p className="text-sm text-slate-500">Audit trail of important actions across the system.</p>
      </div>

      <div className="card flex flex-wrap gap-3 p-4">
        <select
          className="input max-w-[240px]"
          value={action}
          onChange={(e) => { setPage(1); setAction(e.target.value); }}
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replaceAll("_", " ")}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Date/Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No activity found.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(r.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
                </td>
                <td className="px-4 py-3">{r.user ? `${r.user.fullName} (${r.user.userId})` : "—"}</td>
                <td className="px-4 py-3">
                  <span className="badge border-slate-300 bg-slate-100 text-slate-700">
                    {r.action.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.description ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-brand-700">{r.relatedComplaint?.ticketId ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{r.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
