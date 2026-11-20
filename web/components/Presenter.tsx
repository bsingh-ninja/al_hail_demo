"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SPRING } from "@/components/motion";

/* Presenter mode: the meeting walkthrough (README "Walkthrough for the meeting") as a small overlay.
   P toggles it (or open the app with ?present=1), arrow keys move between steps, Esc hides it.
   Each step opens its screen and rings the element to click. Hidden unless toggled; English only. */

type Step = { screen: string; route: string; target: string; action: string; say: string };

const STEPS: Step[] = [
  {
    screen: "Portfolio",
    route: "/",
    target: "attention",
    action: "Open the app",
    say: "Your 12 businesses on one screen. Two need attention: Advanced Technology Development, EBITDA 9.3% under budget for a second quarter, and SAMAA Finance, 6.4% under with a covenant breach.",
  },
  {
    screen: "Business page",
    route: "/business/samaa",
    target: "loans",
    action: "Open SAMAA Finance",
    say: "Revenue and EBITDA against budget, the loan book exceptions (borrower SAMAA-C-017 breaches its DSCR covenant: 1.05 against 1.20), country exposure and the source PDFs.",
  },
  {
    screen: "Copilot",
    route: "/copilot",
    target: "suggest-egypt",
    action: "Ask “What is our total Egypt exposure and what changed this quarter?”",
    say: "It looks up the data first. Click any citation to open the source document at that page.",
  },
  {
    screen: "Copilot",
    route: "/copilot",
    target: "lang-toggle",
    action: "Switch to Arabic and ask the same question",
    say: "Full Arabic, right to left, same sources.",
  },
  {
    screen: "Board pack",
    route: "/board-pack",
    target: "draft",
    action: "Draft board pack, then Download Word file",
    say: "The quarterly pack drafted from this quarter’s figures and documents, every statement linked to its source, ready for the board office to review.",
  },
  {
    screen: "Signals",
    route: "/signals",
    target: "severity-filter",
    action: "Filter by severity or business",
    say: "Risk and news signals across the portfolio, before they reach the board.",
  },
];

const STORE = "alhail-presenter";

function load(): { open: boolean; step: number } {
  try {
    const v = JSON.parse(sessionStorage.getItem(STORE) ?? "null");
    if (v && typeof v.step === "number") return { open: !!v.open, step: Math.min(Math.max(v.step, 0), STEPS.length - 1) };
  } catch {}
  return { open: false, step: 0 };
}

function save(open: boolean, step: number) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify({ open, step }));
  } catch {}
}

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

export default function Presenter() {
  const router = useRouter();
  const path = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = load();
    const fromUrl = new URLSearchParams(window.location.search).get("present") === "1";
    setOpen(saved.open || fromUrl);
    setStep(saved.step);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) save(open, step);
  }, [open, step, ready]);

  const go = useCallback(
    (next: number) => {
      const s = Math.min(Math.max(next, 0), STEPS.length - 1);
      setStep(s);
      if (STEPS[s].route !== path) router.push(STEPS[s].route);
    },
    [path, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
      if (e.key === "p" || e.key === "P") {
        setOpen((o) => !o);
      } else if (open && e.key === "Escape") {
        setOpen(false);
      } else if (open && e.key === "ArrowRight") {
        e.preventDefault();
        go(step + 1);
      } else if (open && e.key === "ArrowLeft") {
        e.preventDefault();
        go(step - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, go]);

  const s = STEPS[step];
  return (
    <>
      {open && <TourRing target={s.target} route={s.route} />}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="presenter"
            dir="ltr"
            lang="en"
            aria-label="Presenter notes"
            initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 12, transition: { duration: 0.16 } }}
            transition={SPRING}
            className="presenter-material fixed bottom-4 right-4 z-[60] w-[min(400px,calc(100vw-32px))] rounded-2xl p-4 text-[13.5px] leading-snug"
          >
            <div className="flex items-center justify-between gap-3 text-[12px] font-semibold text-sidebar-muted">
              <span>
                Presenter, step <span className="num text-sidebar-fg">{step + 1}</span> of {STEPS.length}
              </span>
              <span className="truncate">{s.screen}</span>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden="true">
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-white/15"}`} />
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, x: reduce ? 0 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : -8 }}
                transition={{ duration: 0.18 }}
                className="mt-3 space-y-2"
              >
                <p className="font-semibold text-white">{s.action}</p>
                <p className="text-sidebar-fg/85">&ldquo;{s.say}&rdquo;</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => go(step - 1)}
                disabled={step === 0}
                aria-label="Previous step"
                className="grid size-8 place-items-center rounded-lg bg-white/10 text-sidebar-fg hover:bg-white/16 disabled:opacity-30"
              >
                ←
              </button>
              <button
                onClick={() => go(step + 1)}
                disabled={step === STEPS.length - 1}
                aria-label="Next step"
                className="grid size-8 place-items-center rounded-lg bg-white/10 text-sidebar-fg hover:bg-white/16 disabled:opacity-30"
              >
                →
              </button>
              <span className="ms-auto text-[11.5px] text-sidebar-muted">← → steps, P or Esc hides</span>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/** A soft ring around the element the presenter should click; follows it on scroll and resize. */
function TourRing({ target, route }: { target: string; route: string }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const scrolled = useRef("");

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const el =
        path === route
          ? [...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)].find((e) => e.getClientRects().length > 0) ?? null
          : null;
      if (el) {
        if (scrolled.current !== target) {
          scrolled.current = target;
          el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        }
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev && Math.abs(prev.x - r.left) < 0.5 && Math.abs(prev.y - r.top) < 0.5 && Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
            ? prev
            : { x: r.left, y: r.top, w: r.width, h: r.height },
        );
      } else {
        setRect(null);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, route, path, reduce]);

  if (!rect) return null;
  const pad = 6;
  // Placed directly on the element (so it never lags a scroll); it materialises when the step changes.
  return (
    <motion.div
      key={target}
      aria-hidden="true"
      className="tour-ring pointer-events-none fixed z-[55] rounded-[16px]"
      style={{ left: rect.x - pad, top: rect.y - pad, width: rect.w + pad * 2, height: rect.h + pad * 2 }}
      initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING}
    />
  );
}
