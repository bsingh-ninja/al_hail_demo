"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorBox, Loading, RagPill, SeverityPill, Sparkline, Variance } from "@/components/ui";
import { BusinessSummary, fmt, getJSON, Overview, Signal } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const STRIPE = { green: "", amber: "border-s-[3px] border-s-warn", red: "border-s-[3px] border-s-crit" } as const;
const TONE = { green: "neutral", amber: "warn", red: "crit" } as const;

export default function Cockpit() {
  const { t, lang } = useLang();
  const [data, setData] = useState<Overview | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getJSON<Overview>("/alhail/overview"), getJSON<Signal[]>("/alhail/signals")])
      .then(([o, s]) => {
        setData(o);
        setSignals(s);
      })
      .catch((e) => setError(String(e.message)));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  const name = (o: { name_en: string; name_ar: string }) => (lang === "ar" ? o.name_ar : o.name_en);
  const flagged = data.businesses.filter((b) => b.rag !== "green").sort((a, b) => a.ebitda_var_pct - b.ebitda_var_pct);
  const onTrack = data.businesses.length - flagged.length;
  const revenueBudget = data.businesses.reduce((s, b) => s + b.revenue / (1 + b.revenue_var_pct / 100), 0);
  const revenueVar = (data.totals.revenue / revenueBudget - 1) * 100;
  const ebitdaVar = (data.totals.ebitda / data.totals.ebitda_budget - 1) * 100;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <div className="eyebrow">
            {t.groupPortfolio} · <span dir="ltr">{data.period}</span>
          </div>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight text-primary sm:text-[30px]">
            {t.headline(flagged.length, data.businesses.length)}
          </h1>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-border rounded-lg border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 rtl:sm:divide-x-reverse">
          <Stat label={t.groupRevenue} value={fmt(data.totals.revenue)} unit={t.aedM} delta={<Variance value={revenueVar} />} vs={t.vsBudget} />
          <Stat label={t.groupEbitda} value={fmt(data.totals.ebitda)} unit={t.aedM} delta={<Variance value={ebitdaVar} />} vs={t.vsBudget} />
          <Stat label={t.onTrack} value={`${onTrack}/${data.businesses.length}`} unit={t.businesses} />
        </dl>
      </section>

      {flagged.length > 0 && (
        <section aria-labelledby="attention" className="space-y-3">
          <h2 id="attention" className="eyebrow">
            {t.needAttention}
          </h2>
          <ul className="space-y-2">
            {flagged.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/business/${b.id}`}
                  className={`group grid items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface p-4 transition hover:border-primary/40 sm:grid-cols-[minmax(0,1fr)_auto_auto] ${STRIPE[b.rag]}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-ink">{name(b)}</span>
                      <RagPill rag={b.rag} />
                    </div>
                    <p className="mt-1 text-sm text-muted">{b.reason}</p>
                  </div>
                  <Sparkline points={b.trend} tone={TONE[b.rag]} />
                  <div className="flex items-baseline gap-2 sm:block sm:text-end">
                    <div className="text-xs text-muted">
                      {t.ebitda} {t.vsBudget}
                    </div>
                    <div className="text-lg">
                      <Variance value={b.ebitda_var_pct} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="by-sector" className="min-w-0 space-y-6">
          <h2 id="by-sector" className="eyebrow">
            {t.bySector}
          </h2>
          {data.sectors.map((s) => {
            const items = data.businesses.filter((b) => b.sector_id === s.id);
            return (
              <div key={s.id} className="space-y-2.5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <span className="size-2.5 rounded-[3px] ring-1 ring-silver/40" style={{ background: s.color }} />
                  {name(s)}
                  <span className="font-medium text-muted">· {items.length}</span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((b) => (
                    <BusinessTile key={b.id} b={b} label={name(b)} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <aside aria-labelledby="signals" className="min-w-0 space-y-3">
          <h2 id="signals" className="eyebrow">
            {t.latestSignals}
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {signals.slice(0, 7).map((s, i) => (
              <li key={i} className="space-y-1 p-3.5">
                <div className="flex items-center gap-2 text-xs">
                  <SeverityPill severity={s.severity} />
                  <Link href={`/business/${s.business_id}`} className="truncate font-semibold text-primary hover:underline">
                    {lang === "ar" ? s.name_ar : s.name_en}
                  </Link>
                  <span className="num ms-auto shrink-0 text-muted" dir="ltr">
                    {s.date.slice(5)}
                  </span>
                </div>
                <p className="text-[13px] leading-snug text-ink/90">{s.summary}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, delta, vs }: { label: string; value: string; unit: string; delta?: React.ReactNode; vs?: string }) {
  return (
    <div className="px-4 py-3.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="num text-[22px] font-extrabold text-primary" dir="ltr">
          {value}
        </span>
        <span className="text-xs text-muted">{unit}</span>
        {delta && (
          <span className="text-xs text-muted">
            {delta} {vs}
          </span>
        )}
      </dd>
    </div>
  );
}

function BusinessTile({ b, label }: { b: BusinessSummary; label: string }) {
  const { t } = useLang();
  return (
    <Link
      href={`/business/${b.id}`}
      className={`flex h-full flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:border-primary/40 ${STRIPE[b.rag]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-bold leading-snug text-ink">{label}</div>
          <div className="text-xs text-muted">{b.location}</div>
        </div>
        <RagPill rag={b.rag} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <dl className="grid grid-cols-2 gap-x-4 text-sm">
          <dt className="text-xs text-muted">{t.revenue}</dt>
          <dt className="text-xs text-muted">{t.ebitda}</dt>
          <dd className="num font-bold" dir="ltr">
            {fmt(b.revenue)}
          </dd>
          <dd className="num font-bold" dir="ltr">
            {fmt(b.ebitda)}
          </dd>
          <dd className="text-xs">
            <Variance value={b.revenue_var_pct} />
          </dd>
          <dd className="text-xs">
            <Variance value={b.ebitda_var_pct} />
          </dd>
        </dl>
        <Sparkline points={b.trend} tone={TONE[b.rag]} />
      </div>
      <div className="mt-auto text-xs text-muted">{b.relationship}</div>
    </Link>
  );
}
