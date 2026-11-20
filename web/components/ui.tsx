"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/components/motion";
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

export function Card({ children, className = "", ...rest }: { children: React.ReactNode; className?: string; "data-tour"?: string }) {
  return (
    <div className={`panel ${className}`} {...rest}>
      {children}
    </div>
  );
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

/** EBITDA actual (solid) vs budget (dashed) across quarters, same scale for both, last point emphasised.
 *  The lines draw in left to right when the sparkline first appears. */
export function Sparkline({
  points,
  tone = "neutral",
  width = 120,
  height = 34,
  delay = 0,
}: {
  points: { actual: number; budget: number }[];
  tone?: "neutral" | "warn" | "crit";
  width?: number;
  height?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (points.length < 2) return null;
  const w = width;
  const h = height;
  const pad = 4;
  const values = points.flatMap((p) => [p.actual, p.budget]);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const x = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2);
  const line = (key: "actual" | "budget") => points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p[key])}`).join(" ");
  const area = `${line("actual")} L${x(points.length - 1)},${h} L${x(0)},${h} Z`;
  const stroke = tone === "crit" ? "var(--crit)" : tone === "warn" ? "var(--warn)" : "var(--chart-actual)";
  const last = points[points.length - 1];
  // Same first render on server and client; under reduced motion the draw is instant.
  const draw = (d: number) => ({
    initial: { pathLength: 0 },
    animate: { pathLength: 1 },
    transition: reduce ? { duration: 0 } : { duration: 0.9, delay: delay + d, ease: EASE_OUT },
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block h-auto max-w-full" aria-hidden="true">
      <motion.path
        d={area}
        fill={stroke}
        initial={{ fillOpacity: 0 }}
        animate={{ fillOpacity: 0.08 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, delay: delay + 0.5 }}
      />
      <motion.path d={line("budget")} fill="none" stroke="var(--chart-budget)" strokeWidth={1.25} strokeDasharray="3 3" {...draw(0.1)} />
      <motion.path d={line("actual")} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinejoin="round" {...draw(0)} />
      <motion.circle
        cx={x(points.length - 1)}
        cy={y(last.actual)}
        r={2.75}
        fill={stroke}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : { duration: 0.2, delay: delay + 0.85 }}
      />
    </svg>
  );
}

/** Placeholder shaped like the page that is loading. */
export function Loading({ variant = "page" }: { variant?: "page" | "detail" | "list" }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-10 w-[min(520px,80%)]" />
      </div>
      {variant === "list" ? (
        <div className="panel divide-y divide-hairline">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <div className="skeleton h-3.5 w-48" />
              <div className="skeleton h-3.5" style={{ width: `${88 - i * 9}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="panel space-y-4 p-6">
                <div className="skeleton h-3.5 w-28" />
                <div className="skeleton h-6 w-56" />
                <div className="skeleton h-16" />
              </div>
            ))}
          </div>
          <div className="panel space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-4" style={{ width: `${94 - i * 11}%` }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Shown while a sleeping demo server wakes up; the data hook keeps retrying underneath. */
export function Waking() {
  const { t } = useLang();
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-live="polite">
      <div className="max-w-[44ch] text-center">
        <span className="waking-dot mx-auto mb-5 block size-3 rounded-full bg-accent" aria-hidden="true" />
        <p className="title text-ink">{t.wakingTitle}</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{t.wakingBody}</p>
      </div>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  const { t } = useLang();
  return (
    <div className="rounded-lg border border-crit/30 bg-crit/5 p-4 text-sm text-crit" role="alert">
      {t.loadError(message)}
    </div>
  );
}

/** Loading / waking / error, in one place, for pages that load with `useJSON`. */
export function PageState({ error, waking, variant }: { error: string; waking: boolean; variant?: "page" | "detail" | "list" }) {
  if (error) return <ErrorBox message={error} />;
  if (waking) return <Waking />;
  return <Loading variant={variant} />;
}
