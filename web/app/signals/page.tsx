"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorBox, Loading, SeverityPill } from "@/components/ui";
import { getJSON, Signal, tr } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type Severity = Signal["severity"];
const STRIPE: Record<Severity, string> = { alert: "border-s-crit", watch: "border-s-warn", info: "border-s-transparent" };
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function SignalsPage() {
  const { t, lang } = useLang();
  const [signals, setSignals] = useState<Signal[] | null>(null);
  const [error, setError] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [business, setBusiness] = useState("all");

  useEffect(() => {
    getJSON<Signal[]>("/alhail/signals")
      .then(setSignals)
      .catch((e) => setError(String(e.message)));
  }, []);

  const businesses = useMemo(() => {
    const seen = new Map<string, string>();
    signals?.forEach((s) => s.business_id && seen.set(s.business_id, (lang === "ar" ? s.name_ar : s.name_en) ?? ""));
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [signals, lang]);

  if (error) return <ErrorBox message={error} />;
  if (!signals) return <Loading />;

  const shown = signals.filter((s) => (severity === "all" || s.severity === severity) && (business === "all" || s.business_id === business));
  const byMonth = shown.reduce<Record<string, Signal[]>>((acc, s) => {
    (acc[s.date.slice(0, 7)] ??= []).push(s);
    return acc;
  }, {});
  const monthLabel = (ym: string) => `${(lang === "ar" ? MONTHS_AR : MONTHS_EN)[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
  const counts = { all: signals.length, alert: 0, watch: 0, info: 0 } as Record<Severity | "all", number>;
  signals.forEach((s) => counts[s.severity]++);

  return (
    <div className="mx-auto max-w-[920px] space-y-8">
      <div>
        <h1 className="display text-primary">{t.signals}</h1>
        <p className="mt-3 text-[1.0625rem] text-muted">{t.signalsIntro}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label={t.signals} className="flex rounded-xl bg-surface-2 p-1 text-[0.875rem]">
          {(["all", "alert", "watch", "info"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              aria-pressed={severity === s}
              className={`rounded-lg px-3.5 py-1.5 transition-colors ${severity === s ? "bg-surface font-semibold text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {s === "all" ? t.allSeverities : t.severity[s]} <span className="num opacity-70">{counts[s]}</span>
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="signal-business">
          {t.business}
        </label>
        <select
          id="signal-business"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
          className="h-10 rounded-xl border-0 bg-surface-2 px-3 text-[0.875rem] text-ink"
        >
          <option value="all">{t.allBusinesses}</option>
          {businesses.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <span className="ms-auto text-xs text-muted">{t.showing(shown.length, signals.length)}</span>
      </div>

      {shown.length === 0 ? (
        <div className="panel p-10 text-center text-[0.9375rem] text-muted">{t.noSignals}</div>
      ) : (
        Object.entries(byMonth).map(([ym, items]) => (
          <section key={ym} className="space-y-3">
            <h2 className="title text-[1.0625rem] text-ink">{monthLabel(ym)}</h2>
            <ul className="panel divide-y divide-hairline overflow-hidden">
              {items.map((s, i) => (
                <li key={i} className={`border-s-[3px] px-5 py-4 ${STRIPE[s.severity]}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <SeverityPill severity={s.severity} />
                    <Link href={`/business/${s.business_id}`} className="font-bold text-primary hover:underline">
                      {lang === "ar" ? s.name_ar : s.name_en}
                    </Link>
                    <span className="text-muted">{tr(s, "source", lang)}</span>
                    <span className="num ms-auto text-xs text-muted" dir="ltr">
                      {s.date}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed">{tr(s, "summary", lang)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
