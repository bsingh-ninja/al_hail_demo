"use client";

import { useEffect, useRef, useState } from "react";
import Cited from "@/components/Cited";
import { Card } from "@/components/ui";
import { API } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type ToolStep = { id: string; name: string; input: Record<string, unknown>; count?: number; error?: string };
type Turn = { role: "user" | "assistant"; content: string; tools?: ToolStep[]; error?: string };

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
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary">{t.copilot}</h1>
        <p className="text-sm text-muted">{t.copilotIntro}</p>
      </div>

      {turns.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {[...SUGGESTIONS[lang], ...(lang === "en" ? [] : SUGGESTIONS.en.slice(0, 1))].map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="press-soft rounded-xl border border-border bg-surface p-3 text-start text-sm hover:border-primary/40"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-fg">{turn.content}</div>
            </div>
          ) : (
            <Card key={i} className="p-4">
              {turn.tools && turn.tools.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {turn.tools.map((s) => (
                    <span
                      key={s.id}
                      title={JSON.stringify(s.input)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-2 py-1 text-xs text-muted"
                      dir="ltr"
                    >
                      <span className={`size-1.5 rounded-full ${s.error ? "bg-crit" : s.count === undefined ? "animate-pulse bg-warn" : "bg-ok"}`} />
                      {TOOL_LABEL[s.name] ?? s.name}
                      {Object.values(s.input).filter((v) => v !== null && v !== "").length > 0 && (
                        <span className="text-ink/70">
                          · {Object.values(s.input).filter((v) => v !== null && v !== "").join(", ")}
                        </span>
                      )}
                      {s.count !== undefined && <span>· {s.count}</span>}
                    </span>
                  ))}
                </div>
              )}
              {turn.content ? (
                <div className="prose-copilot text-sm leading-relaxed">
                  <Cited text={turn.content} />
                </div>
              ) : (
                !turn.error && <div className="animate-pulse text-sm text-muted">{t.thinking}</div>
              )}
              {turn.error && <div className="mt-2 rounded-md bg-crit/5 p-2 text-sm text-crit">{turn.error}</div>}
            </Card>
          ),
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="sheet-material sticky bottom-4 flex gap-2 rounded-2xl border border-border p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.askPlaceholder}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
          disabled={busy}
        />
        {busy ? (
          <button
            type="button"
            onClick={() => controller.current?.abort()}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-ink"
          >
            {t.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-fg disabled:opacity-40"
          >
            {t.ask}
          </button>
        )}
      </form>
    </div>
  );
}
