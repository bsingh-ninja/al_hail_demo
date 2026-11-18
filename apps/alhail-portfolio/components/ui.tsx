"use client";

import { Rag, Signal } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const RAG_STYLE: Record<Rag, string> = {
  green: "text-ok",
  amber: "bg-warn/12 text-warn",
  red: "bg-crit/12 text-crit",
};

export function RagPill({ rag }: { rag: Rag }) {
  const { t } = useLang();
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${RAG_STYLE[rag]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {t.rag[rag]}
    </span>
  );
}

const SEV_STYLE = { info: "bg-surface-2 text-muted", watch: "bg-warn/12 text-warn", alert: "bg-crit/12 text-crit" };

export function SeverityPill({ severity }: { severity: Signal["severity"] }) {
  const { t } = useLang();
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${SEV_STYLE[severity]}`}>{t.severity[severity]}</span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-border bg-surface ${className}`}>{children}</div>;
}

export function Variance({ value }: { value: number }) {
  const color = value <= -5 ? "text-crit" : value < 0 ? "text-muted" : "text-ok";
  return (
    <span className={`num font-semibold ${color}`} dir="ltr">
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

/** EBITDA actual (solid) vs budget (dashed) across quarters, same scale for both, last point emphasised. */
export function Sparkline({
  points,
  tone = "neutral",
}: {
  points: { actual: number; budget: number }[];
  tone?: "neutral" | "warn" | "crit";
}) {
  if (points.length < 2) return null;
  const w = 120;
  const h = 34;
  const pad = 3;
  const values = points.flatMap((p) => [p.actual, p.budget]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2);
  const line = (key: "actual" | "budget") => points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ");
  const area = `${line("actual")} L${x(points.length - 1)},${h} L${x(0)},${h} Z`;
  const stroke = tone === "crit" ? "var(--crit)" : tone === "warn" ? "var(--warn)" : "var(--chart-actual)";
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[34px] w-[120px]" aria-hidden="true">
      <path d={area} fill={stroke} fillOpacity={0.08} />
      <path d={line("budget")} fill="none" stroke="var(--chart-budget)" strokeWidth={1.25} strokeDasharray="3 3" />
      <path d={line("actual")} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(last.actual)} r={2.75} fill={stroke} />
    </svg>
  );
}

export function Loading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-surface-2" />
      <div className="h-24 animate-pulse rounded-lg bg-surface-2" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-crit/30 bg-crit/5 p-4 text-sm text-crit">
      Can&apos;t load portfolio data ({message}). Start the API on port 8000, then reload this page.
    </div>
  );
}
