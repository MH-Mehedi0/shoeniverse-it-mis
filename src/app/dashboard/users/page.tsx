"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import { useToast } from "@/components/Toast";

interface UserRow {
  id: string;
  fullName: string;
  userId: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  department: string | null;
  role: "ADMIN" | "IT_USER";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  lastLogin: string | null;
}

const emptyNewUser = {
  fullName: "", userId: "", password: "", confirmPassword: "",
  email: "", phone: "", designation: "", department: "",
  role: "IT_USER" as "ADMIN" | "IT_USER", status: "ACTIVE" as const,
};

export default function UserManagementPage() {
  const { show } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState(emptyNewUser);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/users").then((r) => r.json()).then(setUsers).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleAddUser(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok) {
        show("error", data.error ?? "Could not create user.");
        return;
      }
      show("success", `User ${data.userId} created successfully.`);
      setShowAdd(false);
      setNewUser(emptyNewUser);
      load();
    } catch {
      show("error", "Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: UserRow) {
    const nextStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      show("error", data.error ?? "Could not update user.");
      return;
    }
    show("success", nextStatus === "INACTIVE" ? "User deactivated." : "User reactivated.");
    load();
  }

  async function changeRole(u: UserRow, role: "ADMIN" | "IT_USER") {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      show("error", data.error ?? "Could not update role.");
      return;
    }
    show("success", "Role updated.");
    load();
  }

  async function resetPassword() {
    if (!editing) return;
    if (newPassword.length < 8) {
      show("error", "Password must be at least 8 characters.");
      return;
    }
    const res = await fetch(`/api/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      show("error", data.error ?? "Could not reset password.");
      return;
    }
    show("success", `Password reset for ${editing.userId}.`);
    setEditing(null);
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Add, edit, deactivate, and reset passwords for staff accounts.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add User</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
            {!loading && users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.userId}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as "ADMIN" | "IT_USER")}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="IT_USER">IT User</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.status === "ACTIVE" ? "border-green-300 bg-green-50 text-green-700" : "border-slate-300 bg-slate-100 text-slate-600"}`}>
                    {u.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }) : "Never"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => setEditing(u)}>
                      Reset password
                    </button>
                    <button
                      className={`text-xs font-medium hover:underline ${u.status === "ACTIVE" ? "text-red-600" : "text-green-600"}`}
                      onClick={() => toggleStatus(u)}
                    >
                      {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleAddUser} className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-slate-900">Add User</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Full Name *</label>
                <input required className="input" value={newUser.fullName} onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })} />
              </div>
              <div>
                <label className="label">User ID *</label>
                <input required className="input" value={newUser.userId} onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Password *</label>
                  <input required type="password" className="input" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <div>
                  <label className="label">Confirm *</label>
                  <input required type="password" className="input" value={newUser.confirmPassword} onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Designation</label>
                  <input className="input" value={newUser.designation} onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" value={newUser.department} onChange={(e) => setNewUser({ ...newUser, department: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="01XXXXXXXXX" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Role *</label>
                <select className="input" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "ADMIN" | "IT_USER" })}>
                  <option value="IT_USER">IT User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Creating…" : "Create User"}</button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-slate-900">Reset password</h3>
            <p className="mb-4 text-sm text-slate-500">for {editing.fullName} ({editing.userId})</p>
            <label className="label">New password</label>
            <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="mt-5 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => { setEditing(null); setNewPassword(""); }}>Cancel</button>
              <button className="btn-primary" onClick={resetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
