"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, ErrorBox, Loading, RagPill, SeverityPill, Variance } from "@/components/ui";
import { fmt, getJSON, Overview, Signal } from "@/lib/api";
import { useLang } from "@/lib/i18n";

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

  const ebitdaVar = (data.totals.ebitda / data.totals.ebitda_budget - 1) * 100;
  const name = (o: { name_en: string; name_ar: string }) => (lang === "ar" ? o.name_ar : o.name_en);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t.cockpit}</h1>
          <p className="text-sm text-muted">
            {t.period}: <span className="num font-semibold" dir="ltr">{data.period}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t.groupRevenue} value={fmt(data.totals.revenue)} unit={t.aedM} />
        <Kpi
          label={t.groupEbitda}
          value={fmt(data.totals.ebitda)}
          unit={t.aedM}
          extra={
            <span className="text-xs text-muted">
              <Variance value={ebitdaVar} /> {t.vsBudget}
            </span>
          }
        />
        <Kpi label={t.businesses} value="12" unit="" />
        <Kpi label={t.needAttention} value={String(data.totals.amber_or_red)} unit="" accent />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {data.sectors.map((s) => (
            <section key={s.id}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
                <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                {name(s)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.businesses
                  .filter((b) => b.sector_id === s.id)
                  .map((b) => (
                    <Link key={b.id} href={`/business/${b.id}`} className="group">
                      <Card className="h-full overflow-hidden transition group-hover:border-primary/40 group-hover:shadow-sm">
                        <div className="h-1" style={{ background: s.color }} />
                        <div className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold text-ink">{name(b)}</div>
                              <div className="text-xs text-muted">{b.location}</div>
                            </div>
                            <RagPill rag={b.rag} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-xs text-muted">{t.revenue}</div>
                              <div className="num font-semibold" dir="ltr">
                                {fmt(b.revenue)}
                              </div>
                              <Variance value={b.revenue_var_pct} />
                            </div>
                            <div>
                              <div className="text-xs text-muted">{t.ebitda}</div>
                              <div className="num font-semibold" dir="ltr">
                                {fmt(b.ebitda)}
                              </div>
                              <Variance value={b.ebitda_var_pct} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{b.relationship}</span>
                            {b.flags > 0 && (
                              <span className="font-semibold text-warn">
                                {b.flags} {b.flags === 1 ? t.flag : t.flags}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
              </div>
            </section>
          ))}
        </div>

        <aside>
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-primary">{t.latestSignals}</h2>
            <ul className="space-y-3">
              {signals.slice(0, 7).map((s, i) => (
                <li key={i} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <SeverityPill severity={s.severity} />
                    <Link href={`/business/${s.business_id}`} className="font-semibold text-primary hover:underline">
                      {lang === "ar" ? s.name_ar : s.name_en}
                    </Link>
                    <span className="num ms-auto text-muted" dir="ltr">
                      {s.date}
                    </span>
                  </div>
                  <p className="text-sm text-ink/90">{s.summary}</p>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Kpi({ label, value, unit, extra, accent }: { label: string; value: string; unit: string; extra?: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={`p-4 ${accent ? "border-warn/40" : ""}`}>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`num text-2xl font-bold ${accent ? "text-warn" : "text-primary"}`} dir="ltr">
          {value}
        </span>
        <span className="text-xs text-muted">{unit}</span>
      </div>
      {extra}
    </Card>
  );
}
