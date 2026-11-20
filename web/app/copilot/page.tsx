"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import Cited from "@/components/Cited";
import { EASE_OUT, Reveal, SPRING } from "@/components/motion";
import { API } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type ToolStep = { id: string; name: string; input: Record<string, unknown>; count?: number; error?: string };
type Turn = { role: "user" | "assistant"; content: string; tools?: ToolStep[]; error?: string; cites?: string[] };

const SUGGESTIONS = {
  en: [
    "Which businesses are off budget this quarter, and why?",
    "What is our total Egypt exposure and what changed this quarter?",
    "Summarise the SAMAA Finance covenant breach and the agreed actions.",
    "Show EBITDA vs budget for ATD over the last four quarters.",
  ],
  ar: [
    "ما هو إجمالي تعرضنا في مصر وما الذي تغيّر هذا الربع؟",
    "ما الشركات التي لم تحقق الميزانية هذا الربع، ولماذا؟",
    "لخّص خرق التعهدات لدى سماء للتمويل والإجراءات المتفق عليها.",
  ],
};

const TOOL_LABEL: Record<string, string> = {
  portfolio_overview: "Portfolio overview",
  query_financials: "Financials query",
  list_businesses: "Business list",
  search_documents: "Document search",
  list_signals: "Signals",
  get_exposure: "Country exposure",
  get_loan_exceptions: "Loan exceptions",
};


export default function CopilotPage() {
  const { t, lang } = useLang();
  const reduce = useReducedMotion();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [turns, reduce]);

  const update = (fn: (a: Turn) => Turn) =>
    setTurns((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    const history = [...turns, { role: "user" as const, content: question }];
    setTurns([...history, { role: "assistant", content: "", tools: [] }]);
    setInput("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const res = await fetch(`${API}/alhail/copilot`, {
        signal: controller.current.signal,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const raw of events) {
          if (!raw.startsWith("data: ")) continue;
          const ev = JSON.parse(raw.slice(6));
          if (ev.type === "text") update((a) => ({ ...a, content: a.content + ev.text }));
          else if (ev.type === "tool_call")
            update((a) => ({ ...a, tools: [...(a.tools ?? []), { id: ev.id, name: ev.name, input: ev.input }] }));
          else if (ev.type === "tool_result")
            update((a) => ({
              ...a,
              tools: a.tools?.map((s) => (s.id === ev.id ? { ...s, count: ev.count, error: ev.error } : s)),
            }));
          else if (ev.type === "error") update((a) => ({ ...a, error: ev.message }));
          else if (ev.type === "done") update((a) => ({ ...a, cites: ev.cites ?? [] }));
        }
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") update((a) => ({ ...a, error: a.content ? undefined : t.stopped }));
      else update((a) => ({ ...a, error: `Could not reach the copilot (${(e as Error).message}).` }));
    } finally {
      controller.current = null;
      setBusy(false);
    }
  }

  const composer = (hero: boolean) => (
  <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className={`flex items-center gap-2 rounded-2xl p-2 ${hero ? "panel" : "sheet-material sticky bottom-4 ring-1 ring-border"}`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.askPlaceholder}
          className={`min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted ${hero ? "py-3 text-[1.0625rem]" : "py-2 text-[0.9375rem]"}`}
          disabled={busy}
        />
        {busy ? (
          <button
            type="button"
            onClick={() => controller.current?.abort()}
            className="h-11 rounded-xl bg-surface-2 px-5 text-[0.9375rem] font-semibold text-ink"
          >
            {t.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-11 rounded-xl bg-primary px-5 text-[0.9375rem] font-semibold text-primary-fg disabled:opacity-40"
          >
            {t.ask}
          </button>
        )}
    </form>
  );

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-6">
      {turns.length === 0 ? (
        <section className="space-y-8 pt-[6vh]">
          <Reveal>
            <p className="label">{t.copilot}</p>
            <h1 className="display mt-2 max-w-[20ch] text-primary">{t.copilotHeadline}</h1>
            <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-relaxed text-muted">{t.copilotIntro}</p>
          </Reveal>
          <Reveal delay={0.08}>{composer(true)}</Reveal>
          <Reveal delay={0.16}>
            <p className="label mb-2">{t.tryAsking}</p>
            <ul className="divide-y divide-hairline">
              {[...SUGGESTIONS[lang], ...(lang === "en" ? [] : SUGGESTIONS.en.slice(0, 1))].map((s) => (
                <li key={s}>
                  <button
                    onClick={() => ask(s)}
                    data-tour={/Egypt|مصر/.test(s) ? "suggest-egypt" : undefined}
                    className="press-soft flex w-full items-center gap-3 py-3.5 text-start text-[0.9375rem] text-ink hover:text-primary"
                  >
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                    </svg>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      ) : (
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="title text-ink">{t.copilot}</h1>
          <button onClick={() => setTurns([])} className="text-sm font-semibold text-primary hover:underline" disabled={busy}>
            {t.newConversation}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {turns.map((turn, i) => {
          const streaming = busy && i === turns.length - 1;
          return turn.role === "user" ? (
            <motion.div
              key={i}
              className="flex justify-end"
              initial={{ opacity: 0, y: reduce ? 0 : 8, scale: reduce ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={SPRING}
              style={{ transformOrigin: "100% 100%" }}
            >
              <div className="max-w-[80%] rounded-2xl rounded-ee-md bg-primary px-4 py-2.5 text-[0.9375rem] text-primary-fg">{turn.content}</div>
            </motion.div>
          ) : (
            <motion.div
              key={i}
              className="panel p-5"
              initial={{ opacity: 0, y: reduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05, ease: EASE_OUT }}
            >
              {turn.tools && turn.tools.length > 0 && (
                <ul className="mb-3 flex flex-wrap gap-2" aria-label={t.checked}>
                  <AnimatePresence initial={false}>
                    {turn.tools.map((s) => (
                      <motion.li
                        key={s.id}
                        layout={!reduce}
                        initial={{ opacity: 0, y: reduce ? 0 : 4, scale: reduce ? 1 : 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={SPRING}
                        title={JSON.stringify(s.input)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-2 py-1 text-xs text-muted"
                        dir="ltr"
                      >
                        <StepIcon state={s.error ? "error" : s.count === undefined ? "running" : "done"} />
                        {TOOL_LABEL[s.name] ?? s.name}
                        {Object.values(s.input).filter((v) => v !== null && v !== "").length > 0 && (
                          <span className="text-ink/70">
                            · {Object.values(s.input).filter((v) => v !== null && v !== "").join(", ")}
                          </span>
                        )}
                        {s.count !== undefined && <span>· {s.count}</span>}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              {turn.content ? (
                <div className="prose-copilot text-[0.9375rem] leading-relaxed">
                  <Cited text={turn.content} allowed={turn.cites} className={streaming ? "streaming" : ""} />
                </div>
              ) : (
                !turn.error && (
                  <div className="space-y-2.5" aria-live="polite">
                    <div className="text-sm text-muted">{t.thinking}</div>
                    <div className="skeleton h-3.5 w-[86%]" />
                    <div className="skeleton h-3.5 w-[64%]" />
                  </div>
                )
              )}
              {turn.error && <div className="mt-2 rounded-md bg-crit/5 p-2 text-sm text-crit">{turn.error}</div>}
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      {turns.length > 0 && composer(false)}
    </div>
  );
}

/** Tool step status: a small spinner while the lookup runs, then a check (or a cross on error). */
function StepIcon({ state }: { state: "running" | "done" | "error" }) {
  if (state === "running") return <span className="step-spinner size-3 rounded-full border-[1.5px] border-warn/30 border-t-warn" aria-label="running" />;
  return (
    <svg viewBox="0 0 12 12" className={`size-3 ${state === "done" ? "text-ok" : "text-crit"}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {state === "done" ? <motion.path d="M2.5 6.2l2.2 2.2 4.8-4.9" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.25 }} /> : <path d="M3 3l6 6M9 3l-6 6" />}
    </svg>
  );
}
