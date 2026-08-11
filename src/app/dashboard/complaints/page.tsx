"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_META } from "@/types";

interface ComplaintRow {
  id: string;
  ticketId: string;
  complainerName: string;
  complainerDepartment: string;
  complainerPhone: string;
  deviceName: string;
  deviceModel: string | null;
  complaintDetails: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { fullName: string; userId: string };
}

export default function ComplaintsListPage() {
  const [rows, setRows] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(page));
    fetch(`/api/complaints?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRows(data.data ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [q, status, page]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Complaints</h1>
          <p className="text-sm text-slate-500">Search, filter, and track every ticket.</p>
        </div>
        <Link href="/dashboard/complaints/new" className="btn-primary">
          + Create Complaint
        </Link>
      </div>

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          className="input max-w-xs"
          placeholder="Search ticket, name, phone, device…"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />
        <select
          className="input max-w-[220px]"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop table */}
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket ID</th>
              <th className="px-4 py-3">Complainer</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No complaints match your search.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-brand-700">
                  {r.ticketId}
                </td>
                <td className="px-4 py-3">{r.complainerName}</td>
                <td className="px-4 py-3">{r.complainerDepartment}</td>
                <td className="px-4 py-3">{r.deviceName}{r.deviceModel ? ` · ${r.deviceModel}` : ""}</td>
                <td className="px-4 py-3"><StatusBadge status={r.currentStatus} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}
                </td>
                <td className="px-4 py-3 text-slate-500">{r.createdBy?.fullName}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/complaints/${r.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/complaints/${r.id}`}
            className="card block p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-medium text-brand-700">{r.ticketId}</span>
              <StatusBadge status={r.currentStatus} />
            </div>
            <div className="mt-2 text-sm font-medium text-slate-900">{r.complainerName}</div>
            <div className="text-xs text-slate-500">
              {r.complainerDepartment} · {r.deviceName}
            </div>
          </Link>
        ))}
        {!loading && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No complaints match your search.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
