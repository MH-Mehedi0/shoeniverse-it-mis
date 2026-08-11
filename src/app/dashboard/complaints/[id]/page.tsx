"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline, TimelineEntry } from "@/components/Timeline";
import { STATUS_META } from "@/types";
import { useToast } from "@/components/Toast";

interface ComplaintDetail {
  id: string;
  ticketId: string;
  complainerName: string;
  complainerDesignation: string;
  complainerDepartment: string;
  complainerPhone: string;
  deviceName: string;
  deviceModel: string | null;
  deviceSerial: string | null;
  assetId: string | null;
  location: string | null;
  priority: string | null;
  complaintDetails: string;
  currentStatus: string;
  createdAt: string;
  createdBy: { fullName: string; userId: string };
  statusHistory: TimelineEntry[];
}

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/complaints/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setComplaint(data);
        setNewStatus(data.currentStatus);
      })
      .catch(() => setComplaint(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function confirmStatusChange() {
    setUpdating(true);
    try {
      const res = await fetch(`/api/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, remarks: remarks || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        show("error", data.error ?? "Could not update status.");
        return;
      }
      show("success", "Status updated successfully.");
      setRemarks("");
      setConfirmOpen(false);
      load();
    } catch {
      show("error", "Network error. Please try again.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!complaint) return <div className="text-sm text-red-600">Complaint not found.</div>;

  const dirty = newStatus !== complaint.currentStatus;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-sm text-brand-700">{complaint.ticketId}</div>
          <h1 className="text-xl font-semibold text-slate-900">{complaint.complainerName}&apos;s complaint</h1>
        </div>
        <StatusBadge status={complaint.currentStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Complainer Information</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Name</dt><dd>{complaint.complainerName}</dd>
              <dt className="text-slate-500">Designation</dt><dd>{complaint.complainerDesignation}</dd>
              <dt className="text-slate-500">Department</dt><dd>{complaint.complainerDepartment}</dd>
              <dt className="text-slate-500">Phone</dt><dd>{complaint.complainerPhone}</dd>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Device Information</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Device</dt><dd>{complaint.deviceName}</dd>
              <dt className="text-slate-500">Model</dt><dd>{complaint.deviceModel || "—"}</dd>
              <dt className="text-slate-500">Serial</dt><dd>{complaint.deviceSerial || "—"}</dd>
              <dt className="text-slate-500">Asset ID</dt><dd>{complaint.assetId || "—"}</dd>
              <dt className="text-slate-500">Location</dt><dd>{complaint.location || "—"}</dd>
              <dt className="text-slate-500">Priority</dt><dd>{complaint.priority || "Normal"}</dd>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Complaint Details</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-800">{complaint.complaintDetails}</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Status History</h2>
            <Timeline entries={complaint.statusHistory} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Ticket Info</h2>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-slate-500">Created</dt><dd>{new Date(complaint.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}</dd></div>
              <div><dt className="text-slate-500">Created By</dt><dd>{complaint.createdBy.fullName}</dd></div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Update Status</h2>
            <label className="label">New status</label>
            <select className="input mb-3" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {Object.entries(STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
            <label className="label">Remarks (optional)</label>
            <textarea className="input mb-3 min-h-[80px]" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add a note about this change…" />
            <button
              className="btn-primary w-full"
              disabled={!dirty}
              onClick={() => setConfirmOpen(true)}
            >
              Update Status
            </button>
          </section>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Confirm status change</h3>
            <p className="mt-2 text-sm text-slate-600">
              Change {complaint.ticketId} from <strong>{STATUS_META[complaint.currentStatus].label}</strong> to{" "}
              <strong>{STATUS_META[newStatus].label}</strong>? This will be recorded in the ticket&apos;s history.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setConfirmOpen(false)} disabled={updating}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmStatusChange} disabled={updating}>
                {updating ? "Updating…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
