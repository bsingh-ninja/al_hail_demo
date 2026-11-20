"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SPRING } from "@/components/motion";
import { PageState, SeverityPill } from "@/components/ui";
import { Signal, tr } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useJSON } from "@/lib/useJSON";

type Severity = Signal["severity"];
const STRIPE: Record<Severity, string> = { alert: "border-s-crit", watch: "border-s-warn", info: "border-s-transparent" };
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export default function SignalsPage() {
  const { t, lang } = useLang();
  const reduce = useReducedMotion();
  const res = useJSON<Signal[]>("/alhail/signals");
  const signals = res.data;
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [business, setBusiness] = useState("all");

  const businesses = useMemo(() => {
    const seen = new Map<string, string>();
    signals?.forEach((s) => s.business_id && seen.set(s.business_id, (lang === "ar" ? s.name_ar : s.name_en) ?? ""));
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [signals, lang]);

  if (!signals) return <PageState error={res.error} waking={res.waking} variant="list" />;

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
        <div role="group" aria-label={t.signals} data-tour="severity-filter" className="flex rounded-xl bg-surface-2 p-1 text-[0.875rem]">
          {(["all", "alert", "watch", "info"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              aria-pressed={severity === s}
              className={`relative rounded-lg px-3.5 py-1.5 transition-colors ${severity === s ? "font-semibold text-ink" : "text-muted hover:text-ink"}`}
            >
              {severity === s && (
                <motion.span layoutId="severity-pill" transition={SPRING} className="absolute inset-0 rounded-lg bg-surface shadow-sm" aria-hidden="true" />
              )}
              <span className="relative">
                {s === "all" ? t.allSeverities : t.severity[s]} <span className="num opacity-70">{counts[s]}</span>
              </span>
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

      <LayoutGroup>
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.length === 0 ? (
            <motion.div key="empty" layout={!reduce} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="panel p-10 text-center text-[0.9375rem] text-muted">
              {t.noSignals}
            </motion.div>
          ) : (
            Object.entries(byMonth).map(([ym, items]) => (
              <motion.section
                key={ym}
                layout={!reduce}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={SPRING}
                className="space-y-3"
              >
                <motion.h2 layout={!reduce ? "position" : false} className="title text-[1.0625rem] text-ink">
                  {monthLabel(ym)}
                </motion.h2>
                <motion.ul layout={!reduce} transition={SPRING} className="panel divide-y divide-hairline overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((s) => (
                      <motion.li
                        key={`${s.date}-${s.business_id}-${s.summary.slice(0, 24)}`}
                        layout={!reduce}
                        initial={{ opacity: 0, scale: reduce ? 1 : 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.14 } }}
                        transition={SPRING}
                        className={`border-s-[3px] bg-surface px-5 py-4 ${STRIPE[s.severity]}`}
                      >
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
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              </motion.section>
            ))
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
