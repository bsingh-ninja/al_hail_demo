"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

type Theme = "light" | "dark";

function ThemeToggle({ label }: { label: string }) {
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

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-8 place-items-center rounded-md border border-white/25 hover:bg-white/10"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  const { t, lang, setLang } = useLang();
  const path = usePathname();
  const nav = [
    { href: "/", label: t.cockpit, ready: true },
    { href: "/copilot", label: t.copilot, ready: true },
    { href: "/board-pack", label: t.boardPack, ready: true },
    { href: "/signals", label: t.signals, ready: true },
  ];
  const active = (href: string) => path === href || (href === "/" && path.startsWith("/business"));

  return (
    <header className="header-material sticky top-0 z-20 text-header-fg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/alhail-mark.png" alt="Al Hail Holding" width={26} height={32} priority />
          <div className="leading-tight">
            <div className="text-[15px] font-bold">{t.brand}</div>
            <div className="text-[11px] text-highlight">{t.product}</div>
          </div>
        </Link>
        <div className="ms-auto flex items-center gap-2 text-xs sm:order-last">
          <span className="hidden rounded-full border border-accent/60 px-2.5 py-1 text-accent sm:inline">{t.simulated}</span>
          <ThemeToggle label={t.theme} />
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="h-8 rounded-md border border-white/25 px-3 font-semibold hover:bg-white/10"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
        <nav className="-mx-1 flex w-full gap-1 overflow-x-auto text-sm sm:mx-0 sm:w-auto">
          {nav.map((n) =>
            n.ready ? (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 ${
                  active(n.href) ? "bg-white/15 font-semibold" : "text-white/75 hover:bg-white/10"
                }`}
              >
                {n.label}
              </Link>
            ) : (
              <span key={n.href} title={t.comingSoon} className="cursor-not-allowed whitespace-nowrap rounded-md px-3 py-1.5 text-white/35">
                {n.label}
              </span>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
