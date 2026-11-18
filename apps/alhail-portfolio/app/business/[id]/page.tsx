"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, ErrorBox, Loading, SeverityPill, Variance } from "@/components/ui";
import { API, BusinessDetail, fmt, getJSON, MetricRow } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const FINANCIAL = ["revenue", "ebitda", "net_profit"];

export default function BusinessPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const [d, setD] = useState<BusinessDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getJSON<BusinessDetail>(`/alhail/business/${id}`)
      .then(setD)
      .catch((e) => setError(String(e.message)));
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!d) return <Loading />;

  const b = d.business;
  const series = (metric: string) => d.metrics.filter((m) => m.metric === metric);
  const latestPeriod = d.metrics.at(-1)?.period;
  const kpis = d.metrics.filter((m) => !FINANCIAL.includes(m.metric) && m.period === latestPeriod);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        {lang === "ar" ? "→" : "←"} {t.back}
      </Link>

      <Card className="overflow-hidden">
        <div className="grid gap-4 p-5 md:grid-cols-[1fr_320px]">
          <div>
            <div className="eyebrow flex items-center gap-2"><span className="size-2.5 rounded-[3px] ring-1 ring-silver/40" style={{ background: b.color }} />{lang === "ar" ? b.sector_ar : b.sector_en}</div>
            <h1 className="mt-1 text-2xl font-bold text-primary">{lang === "ar" ? b.name_ar : b.name_en}</h1>
            <div className="mt-1 text-sm text-muted">
              {b.location} · {t.relationship}: {b.relationship}
            </div>
            <p className="mt-3 max-w-2xl text-sm text-ink/90">{b.description}</p>
          </div>
          <div className="rounded-lg bg-bg p-3">
            <div className="mb-2 text-xs font-semibold text-muted">{t.publicFacts}</div>
            <ul className="space-y-1 text-sm">
              {b.facts.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
            <a href={b.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary underline">
              {t.source}: alhail.com
            </a>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={`${t.revenue} (${t.aedM})`} rows={series("revenue")} />
        <ChartCard title={`${t.ebitda} (${t.aedM})`} rows={series("ebitda")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {kpis.length > 0 && (
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-primary">
              {t.kpis} · <span dir="ltr">{latestPeriod}</span>
            </h2>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 text-start font-medium" />
                  <th className="pb-2 text-end font-medium">{t.actual}</th>
                  <th className="pb-2 text-end font-medium">{t.budget}</th>
                  <th className="pb-2 text-end font-medium" />
                </tr>
              </thead>
              <tbody>
                {kpis.map((k) => (
                  <tr key={k.metric} className="border-t border-border">
                    <td className="py-2">
                      {k.label} <span className="text-xs text-muted">({k.unit})</span>
                    </td>
                    <td className="num py-2 text-end font-semibold" dir="ltr">
                      {fmt(k.actual, k.unit === "%" || k.unit.startsWith("AED bn") || k.unit === "m visits" ? 1 : 0)}
                    </td>
                    <td className="num py-2 text-end text-muted" dir="ltr">
                      {fmt(k.budget, k.unit === "%" || k.unit.startsWith("AED bn") || k.unit === "m visits" ? 1 : 0)}
                    </td>
                    <td className="py-2 text-end">
                      {k.unit === "%" ? (
                        <PointsDelta value={k.actual - k.budget} higherIsBad={k.metric === "npl_ratio"} />
                      ) : (
                        <Variance value={(k.actual / k.budget - 1) * 100} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t.signals}</h2>
          {d.signals.length === 0 ? (
            <p className="text-sm text-muted">—</p>
          ) : (
            <ul className="space-y-3">
              {d.signals.map((s, i) => (
                <li key={i}>
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <SeverityPill severity={s.severity} />
                    <span className="text-muted">{s.source}</span>
                    <span className="num ms-auto text-muted" dir="ltr">
                      {s.date}
                    </span>
                  </div>
                  <p className="text-sm">{s.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {d.documents.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t.documents}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {d.documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={`${API}/alhail/documents/${doc.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
                >
                  <span className="rounded bg-crit/10 px-1.5 py-0.5 text-[10px] font-bold text-crit">PDF</span>
                  <span className="flex-1 font-medium">Management accounts</span>
                  <span className="num text-xs text-muted" dir="ltr">
                    {doc.period} · {doc.pages} {doc.pages === 1 ? t.page : t.pages}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {d.loans.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary">{t.loanBook}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 text-start font-medium">{t.borrower}</th>
                  <th className="pb-2 text-end font-medium">
                    {t.outstanding} ({t.aedM})
                  </th>
                  <th className="pb-2 text-end font-medium">{t.dpd}</th>
                  <th className="pb-2 text-end font-medium">{t.dscr}</th>
                  <th className="pb-2 text-end font-medium">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {d.loans.slice(0, 10).map((l) => (
                  <tr key={l.ref} className={`border-t border-border ${l.status === "Covenant breach" ? "bg-crit/5" : ""}`}>
                    <td className="py-2">
                      <span className="num font-semibold" dir="ltr">
                        {l.ref}
                      </span>{" "}
                      <span className="text-xs text-muted">· {l.sector}</span>
                    </td>
                    <td className="num py-2 text-end" dir="ltr">
                      {fmt(l.outstanding_aed_m)}
                    </td>
                    <td className="num py-2 text-end" dir="ltr">
                      {l.dpd}
                    </td>
                    <td className={`num py-2 text-end ${l.dscr < l.dscr_min ? "font-semibold text-crit" : ""}`} dir="ltr">
                      {l.dscr.toFixed(2)} ({l.dscr_min.toFixed(2)})
                    </td>
                    <td
                      className={`py-2 text-end text-xs font-semibold ${
                        l.status === "Covenant breach" ? "text-crit" : l.status === "Watch" ? "text-warn" : "text-ok"
                      }`}
                    >
                      {l.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {d.exposure.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary">
            {t.exposure} ({t.aedM})
          </h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-2 text-start font-medium">{t.country}</th>
                <th className="pb-2 text-start font-medium">{t.period}</th>
                <th className="pb-2 text-end font-medium">{t.aedM}</th>
                <th className="pb-2 text-start font-medium ps-4">{t.note}</th>
              </tr>
            </thead>
            <tbody>
              {d.exposure.map((e) => (
                <tr key={e.country + e.period} className="border-t border-border">
                  <td className="py-2">{e.country}</td>
                  <td className="num py-2" dir="ltr">
                    {e.period}
                  </td>
                  <td className="num py-2 text-end font-semibold" dir="ltr">
                    {fmt(e.carrying_value_aed_m)}
                  </td>
                  <td className="py-2 ps-4 text-xs text-muted">{e.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function PointsDelta({ value, higherIsBad }: { value: number; higherIsBad: boolean }) {
  const bad = higherIsBad ? value > 0 : value < 0;
  return (
    <span className={`num font-semibold ${bad ? "text-crit" : "text-ok"}`} dir="ltr">
      {value > 0 ? "+" : ""}
      {value.toFixed(1)} pp
    </span>
  );
}

function ChartCard({ title, rows }: { title: string; rows: MetricRow[] }) {
  const { t } = useLang();
  return (
    <Card className="p-4">
      <h2 className="mb-2 text-sm font-semibold text-primary">{title}</h2>
      <div className="h-56" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 5, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v: number) => fmt(v)} cursor={{ fill: "var(--surface-2)" }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="actual" name={t.actual} fill="var(--chart-actual)" radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false} />
            <Line dataKey="budget" name={t.budget} stroke="var(--chart-budget)" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3, fill: "var(--chart-budget)" }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
