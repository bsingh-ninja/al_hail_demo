"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

type Theme = "light" | "dark";

const ICONS: Record<string, React.ReactNode> = {
  portfolio: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />,
  copilot: <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z" />,
  boardPack: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  signals: <path d="M3 12h4l2.5-6 5 12 2.5-6h4" />,
};

function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("alhail-theme");
    } catch {}
    const initial: Theme =
      saved === "light" || saved === "dark" ? saved : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    if (saved) document.documentElement.dataset.theme = saved;
    setTheme(initial);
  }, []);
  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("alhail-theme", next);
    } catch {}
    setTheme(next);
  };
  return { theme, toggle };
}

export default function Sidebar() {
  const { t, lang, setLang } = useLang();
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const nav = [
    { href: "/", key: "portfolio", label: t.cockpit },
    { href: "/copilot", key: "copilot", label: t.copilot },
    { href: "/board-pack", key: "boardPack", label: t.boardPack },
    { href: "/signals", key: "signals", label: t.signals },
  ];
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/business") : path.startsWith(href));

  const controls = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        data-tour="lang-toggle"
        className="h-9 rounded-lg bg-white/8 px-3 text-[13px] font-semibold text-sidebar-fg ring-1 ring-white/12 hover:bg-white/14"
      >
        {lang === "en" ? "العربية" : "English"}
      </button>
      <button
        onClick={toggle}
        aria-label={t.theme}
        title={t.theme}
        className="grid size-9 place-items-center rounded-lg bg-white/8 text-sidebar-fg ring-1 ring-white/12 hover:bg-white/14"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          {theme === "dark" ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          ) : (
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          )}
        </svg>
      </button>
    </div>
  );

  return (
    <aside className="sidebar z-30 bg-sidebar text-sidebar-fg lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4 lg:px-6 lg:pb-8 lg:pt-7">
        <Image src="/alhail-mark.png" alt="" width={34} height={42} priority className="rounded-[3px] ring-1 ring-white/15" />
        <div className="min-w-0 leading-tight">
          <div className="text-[15px] font-bold tracking-[-0.01em]">Al Hail Holding</div>
          <div className="text-[13px] text-sidebar-muted" lang="ar" dir="rtl">
            الحيل القابضة
          </div>
        </div>
        <div className="ms-auto lg:hidden">{controls}</div>
      </div>

      <div className="hidden px-6 pb-3 text-[12px] font-semibold text-sidebar-muted lg:block">{t.product}</div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
        {nav.map((n) => {
          const on = active(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={`press-soft relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-[14.5px] transition-colors ${
                on ? "font-semibold text-white" : "text-sidebar-fg/80 hover:bg-white/6 hover:text-white"
              }`}
            >
              {on && (
                // One highlight that slides between items when the page changes
                <motion.span
                  layoutId="nav-active"
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="absolute inset-0 rounded-lg bg-white/10"
                  aria-hidden="true"
                >
                  <span className="absolute inset-y-2 start-0 hidden w-[3px] rounded-full bg-accent lg:block" />
                </motion.span>
              )}
              <svg viewBox="0 0 24 24" className="relative size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
                {ICONS[n.key]}
              </svg>
              <span className="relative">{n.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-4 px-6 pb-6 lg:block">
        <div className="rounded-lg bg-white/6 p-3 text-[12.5px] leading-snug text-sidebar-muted">
          <div className="font-semibold text-sidebar-fg">{t.quarterEnded}</div>
          <div className="mt-1">{t.simulatedNote}</div>
        </div>
        {controls}
        <div className="text-[11.5px] text-sidebar-muted">{t.preparedBy}</div>
      </div>
    </aside>
  );
}
