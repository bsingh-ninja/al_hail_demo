"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Cited from "@/components/Cited";
import { useDocSheet } from "@/components/DocumentSheet";
import { EASE_OUT, Reveal } from "@/components/motion";
import { RagPill, SeverityPill, Variance } from "@/components/ui";
import { API, BoardPack, fmt, getJSON, postJSON } from "@/lib/api";
import { useLang } from "@/lib/i18n";

const PERIOD = "2026-Q3";

export default function BoardPackPage() {
  const { t, lang } = useLang();
  const [pack, setPack] = useState<BoardPack | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [arrived, setArrived] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    setLoaded(false);
    setPack(null);
    getJSON<BoardPack>(`/alhail/board-pack?period=${PERIOD}&lang=${lang}`)
      .then(setPack)
      .catch(() => setPack(null))
      .finally(() => setLoaded(true));
  }, [lang]);

  const draft = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setPack(await postJSON<BoardPack>("/alhail/board-pack", { period: PERIOD, lang }));
      setArrived((n) => n + 1);
      setToast(t.packDrafted);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [lang, t.packDrafted]);

  return (
    <div className="mx-auto max-w-[920px] space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="label">{t.quarter(PERIOD)}</p>
          <h1 className="display mt-2 text-primary">{t.boardPack}</h1>
          <p className="mt-3 max-w-[56ch] text-[1.0625rem] leading-relaxed text-muted">{t.boardPackIntro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pack && !busy && (
            <button
              onClick={draft}
              data-tour="draft"
              className="h-11 rounded-xl bg-primary px-5 text-[0.9375rem] font-semibold text-primary-fg"
            >
              {t.redraftPack}
            </button>
          )}
          {pack && !busy && (
            <a
              href={`${API}/alhail/board-pack/docx?period=${PERIOD}&lang=${lang}`}
              className="pressable inline-flex h-11 items-center rounded-xl bg-surface-2 px-5 text-[0.9375rem] font-semibold text-primary hover:bg-border"
            >
              {t.downloadDocx}
            </a>
          )}
        </div>
      </div>

      {error && <div className="rounded-md border border-crit/30 bg-crit/5 p-3 text-sm text-crit">{error}</div>}

      {!loaded && !busy && <PaperSkeleton />}
      {(busy || (loaded && !pack)) && <Outline drafting={busy} onDraft={draft} />}
      {!busy && pack && <Paper key={arrived} pack={pack} />}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
        {toast && <div className="toast-material toast-in rounded-full px-4 py-2 text-sm font-semibold shadow-lg">{toast}</div>}
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" delay={0.15 + n * 0.12} className="grid gap-x-6 sm:grid-cols-[56px_minmax(0,1fr)]">
      <div className="num text-[44px] font-extrabold leading-none text-accent sm:text-end" aria-hidden="true">
        {n}
      </div>
      <div className="min-w-0 space-y-3">
        <h2 className="pt-1 text-lg font-bold text-primary">{title}</h2>
        {children}
      </div>
    </Reveal>
  );
}

function Paper({ pack }: { pack: BoardPack }) {
  const { t } = useLang();
  const { openDoc } = useDocSheet();
  return (
    <Reveal as="article" className="rounded-sm bg-surface px-5 py-8 shadow-[0_1px_2px_rgba(6,43,73,0.06),0_12px_32px_-12px_rgba(6,43,73,0.18)] ring-1 ring-border sm:px-12 sm:py-12">
      <header className="space-y-4 border-b-2 border-accent pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/alhail-mark.png" alt="" width={30} height={37} />
            <div className="leading-tight">
              <div className="font-bold text-primary">Al Hail Holding</div>
              <div className="text-sm text-muted" lang="ar" dir="rtl">
                الحيل القابضة
              </div>
            </div>
          </div>
          <span className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-primary">{t.packDraft}</span>
        </div>
        <div>
          <h1 className="text-[30px] font-extrabold leading-tight text-primary sm:text-[36px]">{t.packTitle}</h1>
          <p className="mt-1 text-[15px] text-muted">{t.packSubtitle(pack.quarter_end)}</p>
          <p className="mt-2 text-xs text-muted">
            {t.packPrepared(pack.prepared)}.{" "}
            {pack.generated_by === "template" ? t.packByTemplate : t.packByAi(pack.generated_by)}
          </p>
        </div>
      </header>

      <div className="mt-8 space-y-10">
        <Section n={1} title={t.s1}>
          <ul className="space-y-2.5 text-[15px] leading-relaxed">
            {pack.summary.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-accent" />
                <Cited text={s} className="min-w-0" />
              </li>
            ))}
          </ul>
        </Section>

        <Section n={2} title={t.s2}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 text-start font-semibold">{t.business}</th>
                  <th className="py-2 text-end font-semibold">
                    {t.revenue} ({t.aedM})
                  </th>
                  <th className="py-2 text-end font-semibold">{t.vsBudget}</th>
                  <th className="py-2 text-end font-semibold">
                    {t.ebitda} ({t.aedM})
                  </th>
                  <th className="py-2 text-end font-semibold">{t.vsBudget}</th>
                  <th className="py-2 ps-4 text-start font-semibold">{t.status}</th>
                </tr>
              </thead>
              <tbody>
                {pack.performance.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 font-semibold">{p.name}</td>
                    <td className="num py-2 text-end" dir="ltr">
                      {fmt(p.revenue)}
                    </td>
                    <td className="py-2 text-end">
                      <Variance value={p.revenue_var_pct} />
                    </td>
                    <td className="num py-2 text-end" dir="ltr">
                      {fmt(p.ebitda)}
                    </td>
                    <td className="py-2 text-end">
                      <Variance value={p.ebitda_var_pct} />
                    </td>
                    <td className="py-2 ps-4">
                      <RagPill rag={p.rag} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section n={3} title={t.s3}>
          <div className="space-y-5">
            {pack.commentary.map((c) => (
              <div key={c.id} className={c.rag !== "green" ? "border-s-[3px] border-s-warn ps-4" : ""}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-bold text-ink">{c.name}</h3>
                  <span className="text-xs text-muted">
                    {t.ebitda} <Variance value={c.ebitda_var_pct} /> {t.vsBudget}
                  </span>
                </div>
                <Cited text={c.text + (c.cite ? ` [${c.cite}]` : "")} className="mt-1 max-w-[68ch] text-[14.5px] leading-relaxed text-ink/90" />
              </div>
            ))}
          </div>
        </Section>

        {pack.risks.length > 0 && (
          <Section n={4} title={t.s4}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="text-xs text-muted">
                  <tr className="border-b border-border">
                    <th className="py-2 text-start font-semibold">{t.business}</th>
                    <th className="py-2 text-start font-semibold">{t.risk}</th>
                    <th className="py-2 text-start font-semibold">{t.actionAgreed}</th>
                    <th className="py-2 text-start font-semibold">{t.owner}</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {pack.risks.map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="space-y-1 py-2.5 pe-3">
                        <div className="font-semibold">{r.business}</div>
                        <SeverityPill severity={r.severity} />
                      </td>
                      <td className="py-2.5 pe-3">{r.risk}</td>
                      <td className="py-2.5 pe-3">
                        <Cited text={r.action + (r.cite ? ` [${r.cite}]` : "")} />
                      </td>
                      <td className="py-2.5 text-muted">{r.owner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        <Section n={pack.risks.length > 0 ? 5 : 4} title={t.s5}>
          <div className="grid gap-3 sm:grid-cols-2">
            {pack.sectors.map((s) => (
              <div key={s.id} className="rounded-md bg-bg p-4">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <span className="size-2.5 rounded-[3px] ring-1 ring-silver/40" style={{ background: s.color }} />
                  {s.name}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
                  <dt className="text-xs text-muted">{t.revenue}</dt>
                  <dt className="text-xs text-muted">{t.ebitda}</dt>
                  <dd className="num font-bold" dir="ltr">
                    {fmt(s.revenue)}
                  </dd>
                  <dd className="num font-bold" dir="ltr">
                    {fmt(s.ebitda)}
                  </dd>
                  <dd className="text-xs">
                    <Variance value={s.revenue_var_pct} />
                  </dd>
                  <dd className="text-xs">
                    <Variance value={s.ebitda_var_pct} />
                  </dd>
                </dl>
                <p className="mt-2 text-xs text-muted">{s.businesses.join("، ")}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <footer className="mt-10 border-t border-border pt-4 text-xs text-muted">
        <div className="font-semibold text-ink">{t.sources}</div>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {pack.sources.map((s) => (
            <li key={s.id}>
              <a
                href={`${API}/alhail/documents/${s.id}/file`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                  e.preventDefault();
                  openDoc({ id: s.id, page: 1 });
                }}
                className="hover:text-primary hover:underline"
              >
                <span className="num font-semibold" dir="ltr">
                  [{s.cite}]
                </span>{" "}
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </Reveal>
  );
}

function PaperSkeleton() {
  return (
    <div className="space-y-4 rounded-sm bg-surface px-5 py-10 ring-1 ring-border sm:px-12" aria-busy="true">
      <div className="skeleton h-9 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

/** Before a draft exists: what the pack will contain, and the button to draft it.
 *  While drafting: the same outline, with the time elapsed, until the pack arrives. */
function Outline({ drafting, onDraft }: { drafting: boolean; onDraft: () => void }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!drafting) return setSeconds(0);
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(id);
  }, [drafting]);
  const sections = [t.s1, t.s2, t.s3, t.s4, t.s5];
  return (
    <Reveal className="panel overflow-hidden" >
      <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
        <div className="min-w-0" aria-live="polite">
          {drafting ? (
            <>
              <p className="label flex items-center gap-2">
                <span className="waking-dot size-2 rounded-full bg-accent" aria-hidden="true" />
                {t.drafting} <span className="num" dir="ltr">{t.seconds(seconds)}</span>
              </p>
              <h2 className="title mt-3 text-ink">{t.draftingTitle}</h2>
              <p className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-muted">{t.draftingBody}</p>
            </>
          ) : (
            <>
              <p className="label">{t.packEmptyLabel}</p>
              <h2 className="title mt-3 text-ink">{t.packEmptyTitle}</h2>
              <p className="mt-2 max-w-[44ch] text-[0.9375rem] leading-relaxed text-muted">{t.packEmptyBody}</p>
              <button
                onClick={onDraft}
                data-tour="draft"
                className="mt-6 h-11 rounded-xl bg-primary px-5 text-[0.9375rem] font-semibold text-primary-fg"
              >
                {t.draftPack}
              </button>
            </>
          )}
        </div>
        <ol className="space-y-2.5">
          {sections.map((name, i) => (
            <motion.li
              key={name}
              initial={{ opacity: 0, x: reduce ? 0 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease: EASE_OUT }}
              className="flex items-start gap-4 rounded-lg bg-surface-2/70 px-4 py-3"
            >
              <span className="num w-5 pt-px text-[1.375rem] font-extrabold leading-none text-accent">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.9375rem] font-semibold text-ink">{name}</span>
                {drafting && (
                  <span className="mt-2 block space-y-1.5" aria-hidden="true">
                    <span className="skeleton skeleton-strong block h-2" style={{ width: `${82 - i * 7}%`, animationDelay: `${i * 120}ms` }} />
                    <span className="skeleton skeleton-strong block h-2" style={{ width: `${58 - i * 5}%`, animationDelay: `${i * 120 + 60}ms` }} />
                  </span>
                )}
              </span>
            </motion.li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
