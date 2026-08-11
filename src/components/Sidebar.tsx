"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
}

export function Sidebar({
  role,
  fullName,
}: {
  role: "ADMIN" | "IT_USER";
  fullName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const items: NavItem[] =
    role === "ADMIN"
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/complaints", label: "All Complaints" },
          { href: "/dashboard/complaints/new", label: "Create Complaint" },
          { href: "/dashboard/users", label: "User Management" },
          { href: "/dashboard/activity", label: "Activity Logs" },
          { href: "/dashboard/profile", label: "Profile" },
        ]
      : [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/complaints", label: "Complaints" },
          { href: "/dashboard/complaints/new", label: "Create Complaint" },
          { href: "/dashboard/profile", label: "Profile" },
        ];

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-navy-800 bg-navy-900 text-slate-200">
      <div className="border-b border-navy-800 px-5 py-5">
        <div className="text-sm font-semibold tracking-wide text-white">Shoeniverse</div>
        <div className="text-xs text-cyan-400">IT & MIS System</div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-navy-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy-800 px-4 py-4">
        <div className="mb-2 truncate text-xs text-slate-400">
          Signed in as <span className="text-slate-200">{fullName}</span>
          <div className="text-cyan-400">{role === "ADMIN" ? "Admin" : "IT User"}</div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-navy-800 disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </aside>
  );
}
