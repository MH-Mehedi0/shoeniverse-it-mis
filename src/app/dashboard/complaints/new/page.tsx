"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { DEVICE_OPTIONS } from "@/types";
import { useToast } from "@/components/Toast";

const STEPS = ["Ticket Info", "Complainer Info", "Device & Complaint", "Review & Submit"];

interface FormState {
  complainerName: string;
  complainerDesignation: string;
  complainerDepartment: string;
  complainerPhone: string;
  deviceName: string;
  deviceNameOther: string;
  deviceModel: string;
  deviceSerial: string;
  assetId: string;
  location: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  complaintDetails: string;
}

const initialState: FormState = {
  complainerName: "",
  complainerDesignation: "",
  complainerDepartment: "",
  complainerPhone: "",
  deviceName: "",
  deviceNameOther: "",
  deviceModel: "",
  deviceSerial: "",
  assetId: "",
  location: "",
  priority: "Normal",
  complaintDetails: "",
};

export default function NewComplaintPage() {
  const router = useRouter();
  const { show } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (!form.complainerName.trim()) e.complainerName = "Required.";
    if (!form.complainerDesignation.trim()) e.complainerDesignation = "Required.";
    if (!form.complainerDepartment.trim()) e.complainerDepartment = "Required.";
    if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(form.complainerPhone.replace(/[\s-]/g, "")))
      e.complainerPhone = "Enter a valid Bangladeshi phone number.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3(): boolean {
    const e: Record<string, string> = {};
    if (!form.deviceName) e.deviceName = "Required.";
    if (form.deviceName === "Other" && !form.deviceNameOther.trim()) e.deviceNameOther = "Please specify the device.";
    if (form.complaintDetails.trim().length < 10) e.complaintDetails = "Please describe the problem in more detail.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setErrors({});
    setStep((s) => Math.min(4, s + 1));
  }
  function back() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainerName: form.complainerName,
          complainerDesignation: form.complainerDesignation,
          complainerDepartment: form.complainerDepartment,
          complainerPhone: form.complainerPhone,
          deviceName: form.deviceName === "Other" ? form.deviceNameOther : form.deviceName,
          deviceModel: form.deviceModel || undefined,
          deviceSerial: form.deviceSerial || undefined,
          assetId: form.assetId || undefined,
          location: form.location || undefined,
          priority: form.priority,
          complaintDetails: form.complaintDetails,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        show("error", data.error ?? "Could not create complaint.");
        return;
      }
      show("success", `Complaint ${data.ticketId} created successfully.`);
      router.push(`/dashboard/complaints/${data.id}`);
    } catch {
      show("error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Create Complaint</h1>
        <p className="text-sm text-slate-500">Follow the 4 steps to log a new IT ticket.</p>
      </div>

      <div className="card p-6">
        <Stepper steps={STEPS} currentStep={step} />

        <div className="mt-8">
          {step === 1 && (
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl">
                🎫
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Ticket Information</h2>
              <p className="text-sm text-slate-500">
                A unique tracking ID (e.g. <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">IT-20260810-0001</code>)
                will be generated automatically once you submit this complaint. You don&apos;t need to enter it —
                it&apos;s guaranteed unique and searchable.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Complainer Information</h2>
              <div>
                <label className="label">Person Name *</label>
                <input className="input" value={form.complainerName} onChange={(e) => update("complainerName", e.target.value)} />
                {errors.complainerName && <p className="field-error">{errors.complainerName}</p>}
              </div>
              <div>
                <label className="label">Designation *</label>
                <input className="input" value={form.complainerDesignation} onChange={(e) => update("complainerDesignation", e.target.value)} />
                {errors.complainerDesignation && <p className="field-error">{errors.complainerDesignation}</p>}
              </div>
              <div>
                <label className="label">Department *</label>
                <input className="input" value={form.complainerDepartment} onChange={(e) => update("complainerDepartment", e.target.value)} />
                {errors.complainerDepartment && <p className="field-error">{errors.complainerDepartment}</p>}
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input className="input" placeholder="01XXXXXXXXX" value={form.complainerPhone} onChange={(e) => update("complainerPhone", e.target.value)} />
                {errors.complainerPhone && <p className="field-error">{errors.complainerPhone}</p>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Device & Complaint Information</h2>
              <div>
                <label className="label">Device Name *</label>
                <select className="input" value={form.deviceName} onChange={(e) => update("deviceName", e.target.value)}>
                  <option value="">Select a device…</option>
                  {DEVICE_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.deviceName && <p className="field-error">{errors.deviceName}</p>}
              </div>
              {form.deviceName === "Other" && (
                <div>
                  <label className="label">Please specify *</label>
                  <input className="input" value={form.deviceNameOther} onChange={(e) => update("deviceNameOther", e.target.value)} />
                  {errors.deviceNameOther && <p className="field-error">{errors.deviceNameOther}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Device Model</label>
                  <input className="input" value={form.deviceModel} onChange={(e) => update("deviceModel", e.target.value)} />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={(e) => update("priority", e.target.value as FormState["priority"])}>
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Serial Number</label>
                  <input className="input" value={form.deviceSerial} onChange={(e) => update("deviceSerial", e.target.value)} />
                </div>
                <div>
                  <label className="label">Asset ID</label>
                  <input className="input" value={form.assetId} onChange={(e) => update("assetId", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location} onChange={(e) => update("location", e.target.value)} />
              </div>
              <div>
                <label className="label">Detailed Information of Complaint *</label>
                <textarea
                  className="input min-h-[120px]"
                  value={form.complaintDetails}
                  onChange={(e) => update("complaintDetails", e.target.value)}
                  placeholder="Describe the problem in enough detail for IT to troubleshoot…"
                />
                {errors.complaintDetails && <p className="field-error">{errors.complaintDetails}</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Review &amp; Submit</h2>
              <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {[
                  ["Complainer", form.complainerName],
                  ["Designation", form.complainerDesignation],
                  ["Department", form.complainerDepartment],
                  ["Phone", form.complainerPhone],
                  ["Device", form.deviceName === "Other" ? form.deviceNameOther : form.deviceName],
                  ["Model", form.deviceModel || "—"],
                  ["Priority", form.priority],
                  ["Complaint", form.complaintDetails],
                ].map(([k, v]) => (
                  <div key={k as string} className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                    <dt className="font-medium text-slate-500">{k}</dt>
                    <dd className="col-span-2 text-slate-900">{v}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
                  <dt className="font-medium text-slate-500">Initial Status</dt>
                  <dd className="col-span-2"><span className="badge border-status-pending/30 bg-status-pending/15 text-yellow-700">Pending</span></dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button className="btn-secondary" onClick={back} disabled={step === 1}>
            Back
          </button>
          {step < 4 ? (
            <button className="btn-primary" onClick={next}>Next</button>
          ) : (
            <button className="btn-primary" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Complaint"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
