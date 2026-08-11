import Link from "next/link";

const CONTACTS = [
  { name: "MD. Mehedi Hasan", phone: "01755-512057" },
  { name: "Nasim Mia", phone: "01708-482177" },
  { name: "Jannatul Ferdous Aksh", phone: "01755-512059" },
  { name: "Bijoy Hossain", phone: "01817-834281" },
  { name: "Rashedul Islam", phone: "01516-568893" },
];

const FEATURES = [
  { title: "Log a ticket in seconds", body: "A guided 4-step form captures the complainer, the device, and the problem — with an auto-generated tracking ID." },
  { title: "Track every status", body: "Pending, Device Collected, On Process, Done, Cancelled — always visible, always current." },
  { title: "Full history, never overwritten", body: "Every status change is timestamped and attributed. Nothing is silently lost." },
  { title: "Built for the team", body: "Role-based access keeps admin tools separate from day-to-day ticket work." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold tracking-tight">
          Shoeniverse <span className="text-cyan-400">IT & MIS</span>
        </div>
        <Link href="/login" className="btn-primary">
          Login
        </Link>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-3 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
            Internal IT Support Platform
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
            Shoeniverse IT &amp; MIS System
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            A centralized IT Complaint Management System for recording, tracking and
            resolving user IT issues efficiently.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Manage &middot; Track &middot; Resolve IT Issues
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/login" className="btn-primary px-6 py-3 text-base">
              Login to the system
            </Link>
          </div>
        </div>

        {/* CSS/SVG circuit-board illustration — no external image assets */}
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2389fa" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <rect x="20" y="20" width="360" height="360" rx="24" fill="#0f1f3d" stroke="#1c3766" strokeWidth="2" />
            {[
              [80, 80], [200, 60], [320, 100], [60, 220], [200, 200], [340, 240], [100, 330], [260, 340],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 10 : 6} fill="url(#g1)" opacity={0.9} />
            ))}
            <path
              d="M80 80 L200 60 L320 100 M60 220 L200 200 L340 240 M100 330 L260 340 M200 60 L200 200 M320 100 L340 240 M60 220 L100 330"
              stroke="#2389fa"
              strokeWidth="2"
              fill="none"
              opacity="0.5"
            />
            <rect x="160" y="160" width="80" height="80" rx="10" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
            <text x="200" y="206" textAnchor="middle" fontSize="28" fill="#22d3ee" fontFamily="monospace">IT</text>
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-navy-800 bg-navy-900 p-5">
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-6 text-xl font-semibold text-white">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {["Log in", "Submit a ticket", "IT tracks progress", "Issue resolved"].map((s, i) => (
            <div key={s} className="rounded-xl border border-navy-800 bg-navy-900 p-4">
              <div className="mb-2 text-xs font-medium text-cyan-400">Step {i + 1}</div>
              <div className="text-sm font-medium text-slate-200">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy-800 bg-navy-900/60">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            IT Support Team
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTACTS.map((c) => (
              <div key={c.phone} className="rounded-lg border border-navy-800 bg-navy-950 p-4">
                <div className="font-medium text-slate-100">{c.name}</div>
                <div className="text-sm text-slate-400">{c.phone}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-navy-800 pt-6 text-center text-xs text-slate-500">
            All copyright reserved by 💕MD.Mehedi Hasan.
          </div>
        </div>
      </footer>
    </div>
  );
}
