import { STATUS_META } from "@/types";

export interface TimelineEntry {
  id: string;
  previousStatus: string | null;
  newStatus: string;
  remarks: string | null;
  createdAt: string;
  changedBy: { fullName: string; userId: string } | null;
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No history yet.</p>;
  }

  return (
    <ol className="relative border-l-2 border-slate-200 pl-6">
      {entries.map((e) => {
        const meta = STATUS_META[e.newStatus];
        return (
          <li key={e.id} className="mb-6 last:mb-0">
            <span
              className={`absolute -left-[9px] h-4 w-4 rounded-full border-2 border-white ${meta?.dotClass ?? "bg-slate-400"}`}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{meta?.label ?? e.newStatus}</span>
              {e.previousStatus && (
                <span className="text-xs text-slate-400">
                  (from {STATUS_META[e.previousStatus]?.label ?? e.previousStatus})
                </span>
              )}
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {new Date(e.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" })}
              {e.changedBy && <> · by {e.changedBy.fullName}</>}
            </div>
            {e.remarks && <div className="mt-1 text-sm text-slate-700">{e.remarks}</div>}
          </li>
        );
      })}
    </ol>
  );
}
