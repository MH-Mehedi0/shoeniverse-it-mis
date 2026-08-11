export const STATUS_META: Record<
  string,
  { label: string; badgeClass: string; dotClass: string }
> = {
  PENDING: {
    label: "Pending",
    badgeClass: "bg-status-pending/15 text-yellow-700 border-status-pending/30",
    dotClass: "bg-status-pending",
  },
  DEVICE_COLLECTED: {
    label: "Device Collected / Allocated",
    badgeClass: "bg-status-collected/15 text-blue-700 border-status-collected/30",
    dotClass: "bg-status-collected",
  },
  ON_PROCESS: {
    label: "On Process",
    badgeClass: "bg-status-process/15 text-orange-700 border-status-process/30",
    dotClass: "bg-status-process",
  },
  DONE: {
    label: "Done",
    badgeClass: "bg-status-done/15 text-green-700 border-status-done/30",
    dotClass: "bg-status-done",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-status-cancel/15 text-red-700 border-status-cancel/30",
    dotClass: "bg-status-cancel",
  },
};

export const DEVICE_OPTIONS = [
  "Desktop",
  "Laptop",
  "Printer",
  "Scanner",
  "Monitor",
  "Router",
  "Switch",
  "UPS",
  "IP Phone",
  "Other",
];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  IT_USER: "IT User",
};
