"use client";

import { Rag, Signal } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const RAG_STYLE: Record<Rag, string> = {
  green: "bg-ok/10 text-ok",
  amber: "bg-warn/15 text-warn",
  red: "bg-crit/10 text-crit",
};

export function RagPill({ rag }: { rag: Rag }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${RAG_STYLE[rag]}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {t.rag[rag]}
    </span>
  );
}

const SEV_STYLE = { info: "bg-highlight/25 text-primary", watch: "bg-warn/15 text-warn", alert: "bg-crit/10 text-crit" };

export function SeverityPill({ severity }: { severity: Signal["severity"] }) {
  const { t } = useLang();
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${SEV_STYLE[severity]}`}>{t.severity[severity]}</span>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>;
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

export function Loading() {
  return <div className="py-20 text-center text-sm text-muted">Loading…</div>;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-crit/30 bg-crit/5 p-4 text-sm text-crit">
      Could not reach the API ({message}). Is the backend running on port 8000?
    </div>
  );
}
