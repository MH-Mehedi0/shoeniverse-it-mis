"use client";

import { useEffect, useState, FormEvent } from "react";
import { useToast } from "@/components/Toast";
import { ROLE_LABELS } from "@/types";

interface Me {
  sub: string;
  userId: string;
  role: "ADMIN" | "IT_USER";
  fullName: string;
}

export default function ProfilePage() {
  const { show } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user));
  }, []);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      show("error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      show("error", "New password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        show("error", data.error ?? "Could not change password.");
        return;
      }
      show("success", "Password changed successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      show("error", "Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!me) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your account details.</p>
      </div>

      <div className="card p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Full Name</dt><dd>{me.fullName}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">User ID</dt><dd className="font-mono">{me.userId}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd>{ROLE_LABELS[me.role]}</dd></div>
        </dl>
      </div>

      <form onSubmit={handleChangePassword} className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-slate-700">Change Password</h2>
        <div>
          <label className="label">Current password</label>
          <input type="password" required className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">New password</label>
          <input type="password" required className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">Confirm new password</label>
          <input type="password" required className="input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving…" : "Change Password"}
        </button>
      </form>
    </div>
  );
}
