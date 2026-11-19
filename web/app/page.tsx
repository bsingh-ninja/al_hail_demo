"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { ErrorBox, Loading, RagPill, Sparkline, Variance } from "@/components/ui";
import { BusinessSummary, fmt, getJSON, Overview, Signal, tr } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const TONE = { green: "neutral", amber: "warn", red: "crit" } as const;
const DOT = { info: "bg-silver", watch: "bg-warn", alert: "bg-crit" } as const;

export default function Cockpit() {
  const { t, lang } = useLang();
  const router = useRouter();
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
  const sectorOf = Object.fromEntries(data.sectors.map((s) => [s.id, s]));

  return (
    <div className="space-y-12">
      {/* Opening: the answer first, then the three numbers that back it */}
      <section className="grid items-end gap-8 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="label">
            {t.groupPortfolio}, <span dir="ltr">{data.period}</span>
          </p>
          <h1 className="display mt-2 max-w-[22ch] text-primary">{t.headline(flagged.length, data.businesses.length)}</h1>
        </div>
        <dl className="grid grid-cols-3 gap-6 sm:gap-10">
          <Figure label={t.groupRevenue} value={fmt(data.totals.revenue)} unit={t.aedM} delta={revenueVar} vs={t.vsBudget} />
          <Figure label={t.groupEbitda} value={fmt(data.totals.ebitda)} unit={t.aedM} delta={ebitdaVar} vs={t.vsBudget} />
          <Figure label={t.onTrack} value={`${onTrack}`} unit={`/ ${data.businesses.length} ${t.businesses}`} />
        </dl>
      </section>

      {flagged.length > 0 && (
        <section aria-labelledby="attention" className="space-y-4">
          <h2 id="attention" className="title text-ink">
            {t.needAttention}
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {flagged.map((b) => (
              <Link key={b.id} href={`/business/${b.id}`} className="panel press-soft group relative block overflow-hidden p-6">
                <span
                  className={`absolute inset-y-0 start-0 w-1 ${b.rag === "red" ? "bg-crit" : "bg-warn"}`}
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="label">{name(sectorOf[b.sector_id])}</div>
                    <h3 className="title mt-1 text-ink group-hover:text-primary">{name(b)}</h3>
                  </div>
                  <RagPill rag={b.rag} />
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <div className={`figure text-[2.5rem] ${b.rag === "red" ? "text-crit" : "text-warn"}`} dir="ltr">
                      {b.ebitda_var_pct > 0 ? "+" : ""}
                      {b.ebitda_var_pct.toFixed(1)}%
                    </div>
                    <div className="label mt-1.5">
                      {t.ebitda} {t.vsBudget}
                    </div>
                  </div>
                  <div className="min-w-0 max-w-[220px] flex-1">
                    <Sparkline points={b.trend} tone={TONE[b.rag]} width={220} height={64} />
                  </div>
                </div>
                <p className="mt-5 border-t border-hairline pt-4 text-[0.9375rem] leading-relaxed text-ink/85">{tr(b, "reason", lang)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-10 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="by-sector" className="min-w-0 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="by-sector" className="title text-ink">
              {t.bySector}
            </h2>
            <span className="label hidden sm:inline">{t.aedM}</span>
          </div>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed text-[0.9375rem]">
              <thead>
                <tr className="text-start text-[0.8125rem] text-muted">
                  <th className="px-5 pb-3 pt-4 text-start font-semibold">{t.business}</th>
                  <th className="w-[110px] px-3 pb-3 pt-4 text-end font-semibold">{t.revenue}</th>
                  <th className="w-[110px] px-3 pb-3 pt-4 text-end font-semibold">{t.ebitda}</th>
                  <th className="hidden w-[190px] px-6 pb-3 pt-4 text-start font-semibold md:table-cell">{t.trendShort}</th>
                  <th className="w-[130px] px-5 pb-3 pt-4 text-end font-semibold">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {data.sectors.map((s) => {
                  const items = data.businesses.filter((b) => b.sector_id === s.id);
                  return (
                    <Fragment key={s.id}>
                      <tr>
                        <td colSpan={5} className="bg-surface-2/60 px-5 py-2 text-[0.8125rem] font-bold text-ink">
                          <span className="me-2 inline-block size-2 rounded-full align-middle ring-1 ring-silver/40" style={{ background: s.color }} />
                          {name(s)}
                        </td>
                      </tr>
                      {items.map((b) => (
                        <Row key={b.id} b={b} label={name(b)} onOpen={() => router.push(`/business/${b.id}`)} />
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside aria-labelledby="signals" className="min-w-0 space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="signals" className="title text-ink">
              {t.latestSignals}
            </h2>
            <Link href="/signals" className="text-sm font-semibold text-primary hover:underline">
              {t.viewAll}
            </Link>
          </div>
          <ol className="relative space-y-5 border-s border-hairline ps-5">
            {signals.slice(0, 6).map((s, i) => (
              <li key={i} className="relative">
                <span className={`absolute -start-[25px] top-1.5 size-2.5 rounded-full ring-4 ring-bg ${DOT[s.severity]}`} aria-hidden="true" />
                <div className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]">
                  <Link href={`/business/${s.business_id}`} className="font-bold text-ink hover:text-primary hover:underline">
                    {lang === "ar" ? s.name_ar : s.name_en}
                  </Link>
                  <span className="num text-muted" dir="ltr">
                    {s.date}
                  </span>
                </div>
                <p className="mt-1 text-[0.875rem] leading-snug text-ink/85">{tr(s, "summary", lang)}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Figure({ label, value, unit, delta, vs }: { label: string; value: string; unit: string; delta?: number; vs?: string }) {
  return (
    <div className="min-w-0">
      <dt className="label">{label}</dt>
      <dd className="mt-2">
        <span className="figure text-[1.75rem] text-primary sm:text-[2.125rem]" dir="ltr">
          {value}
        </span>
        <span className="ms-1.5 text-[0.8125rem] text-muted">{unit}</span>
        {delta !== undefined && (
          <div className="mt-1.5 text-[0.8125rem] text-muted">
            <Variance value={delta} /> {vs}
          </div>
        )}
      </dd>
    </div>
  );
}

function Row({ b, label, onOpen }: { b: BusinessSummary; label: string; onOpen: () => void }) {
  const { lang } = useLang();
  return (
    <tr onClick={onOpen} className="cursor-pointer border-t border-hairline transition-colors hover:bg-surface-2/50">
      <td className="px-5 py-3.5">
        <Link href={`/business/${b.id}`} onClick={(e) => e.stopPropagation()} className="font-semibold text-ink hover:text-primary">
          {label}
        </Link>
        <div className="text-[0.8125rem] text-muted">{tr(b, "location", lang)}</div>
      </td>
      <td className="px-3 py-3.5 text-end">
        <div className="num font-semibold" dir="ltr">
          {fmt(b.revenue)}
        </div>
        <div className="text-[0.8125rem]">
          <Variance value={b.revenue_var_pct} />
        </div>
      </td>
      <td className="px-3 py-3.5 text-end">
        <div className="num font-semibold" dir="ltr">
          {fmt(b.ebitda)}
        </div>
        <div className="text-[0.8125rem]">
          <Variance value={b.ebitda_var_pct} />
        </div>
      </td>
      <td className="hidden px-6 py-3.5 md:table-cell">
        <Sparkline points={b.trend} tone={TONE[b.rag]} width={132} height={34} />
      </td>
      <td className="px-5 py-3.5 text-end">
        <RagPill rag={b.rag} />
      </td>
    </tr>
  );
}
