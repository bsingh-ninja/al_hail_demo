"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { API } from "@/lib/api";
import { useLang } from "@/lib/i18n";

type Doc = { id: number; page: number };
type DocMeta = { id: number; title: string };

const SheetContext = createContext<{ openDoc: (d: Doc) => void }>({ openDoc: () => {} });
export const useDocSheet = () => useContext(SheetContext);

// Apple's momentum projection (Designing Fluid Interfaces): where a flick would come to rest.
const project = (velocity: number, decelerationRate = 0.998) => ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
// Progressive resistance past the open edge: real things slow before they stop.
const rubberband = (overshoot: number, dimension: number, c = 0.55) =>
  (overshoot * dimension * c) / (dimension + c * Math.abs(overshoot));

export function DocumentSheetProvider({ children }: { children: React.ReactNode }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const openDoc = useCallback((d: Doc) => setDoc(d), []);
  return (
    <SheetContext.Provider value={{ openDoc }}>
      {children}
      {doc && <DocumentSheet doc={doc} onClosed={() => setDoc(null)} />}
    </SheetContext.Provider>
  );
}

function DocumentSheet({ doc, onClosed }: { doc: Doc; onClosed: () => void }) {
  const { t, lang } = useLang();
  const reduceMotion = useReducedMotion();
  const sign = lang === "ar" ? -1 : 1; // the sheet lives on the trailing edge; it leaves the way it came
  const [width, setWidth] = useState(560);
  const x = useMotionValue(sign * 600);
  const opacity = useMotionValue(reduceMotion ? 0 : 1);
  const history = useRef<{ x: number; t: number }[]>([]);
  const grab = useRef<{ startX: number; startValue: number } | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const [titles, setTitles] = useState<Record<number, string>>({});

  const closedX = sign * width;

  const settle = useCallback(
    (target: number, velocity = 0) => {
      if (reduceMotion) {
        animate(opacity, target === 0 ? 1 : 0, { duration: 0.2 }).then(() => target !== 0 && onClosed());
        return;
      }
      // Critically damped by default; a little bounce only when a flick carried momentum.
      const bounce = Math.abs(velocity) > 400 ? 0.18 : 0;
      animate(x, target, { type: "spring", bounce, duration: 0.32, velocity }).then(() => {
        if (target !== 0) onClosed();
      });
    },
    [reduceMotion, opacity, x, onClosed],
  );

  // Enter: measure, start off-screen, spring in (or cross-fade with reduced motion)
  useEffect(() => {
    const w = Math.min(560, window.innerWidth);
    setWidth(w);
    returnFocus.current = document.activeElement;
    if (reduceMotion) {
      x.set(0);
      animate(opacity, 1, { duration: 0.2 });
    } else {
      x.set(sign * w);
      animate(x, 0, { type: "spring", bounce: 0, duration: 0.36 });
    }
    closeButton.current?.focus();
    return () => {
      (returnFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [reduceMotion, sign, x, opacity]);

  useEffect(() => {
    fetch(`${API}/alhail/documents`)
      .then((r) => r.json())
      .then((rows: DocMeta[]) => setTitles(Object.fromEntries(rows.map((r) => [r.id, r.title]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && settle(closedX);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settle, closedX]);

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return; // controls keep their own behaviour
    e.currentTarget.setPointerCapture(e.pointerId);
    x.stop(); // interrupt any running spring and start from where the sheet is on screen
    grab.current = { startX: e.clientX, startValue: x.get() };
    history.current = [{ x: x.get(), t: performance.now() }];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!grab.current) return;
    const raw = grab.current.startValue + (e.clientX - grab.current.startX);
    const outward = sign * raw; // positive = toward dismissal
    x.set(outward < 0 ? sign * rubberband(outward, width) : raw); // 1:1, with resistance past the open edge
    history.current = [...history.current.slice(-5), { x: x.get(), t: performance.now() }];
  };

  const onPointerUp = () => {
    if (!grab.current) return;
    grab.current = null;
    const h = history.current;
    const first = h[0];
    const last = h[h.length - 1];
    const dt = (last.t - first.t) / 1000;
    const velocity = dt > 0 ? (last.x - first.x) / dt : 0; // px/s at release
    const projected = x.get() + project(velocity);
    settle(sign * projected > width / 2 ? closedX : 0, velocity); // choose the target from where the flick is going
  };

  const title = titles[doc.id] ?? `D${doc.id}`;

  return (
    <motion.aside
      role="dialog"
      aria-label={title}
      style={{ x, opacity, width }}
      className="sheet-material fixed inset-y-0 end-0 z-40 flex max-w-full flex-col border-s border-border"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex cursor-grab touch-none select-none items-center gap-3 px-4 py-3 active:cursor-grabbing"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))" }}
      >
        <span className="h-9 w-1 shrink-0 rounded-full bg-silver/50" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-muted">
            {t.sourceDocument}, {t.page} {doc.page}
          </div>
          <div className="truncate text-[15px] font-bold tracking-[-0.01em] text-primary">{title}</div>
        </div>
        <a
          href={`${API}/alhail/documents/${doc.id}/file#page=${doc.page}`}
          target="_blank"
          rel="noreferrer"
          className="pressable rounded-md px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-surface-2"
        >
          {t.openInNewTab}
        </a>
        <button
          ref={closeButton}
          onClick={() => settle(closedX)}
          aria-label={t.close}
          className="pressable grid size-8 place-items-center rounded-full bg-surface-2 text-ink hover:bg-border"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <iframe
        key={`${doc.id}-${doc.page}`}
        title={title}
        src={`${API}/alhail/documents/${doc.id}/file#page=${doc.page}&view=FitH`}
        className="min-h-0 flex-1 bg-white"
      />
    </motion.aside>
  );
}
