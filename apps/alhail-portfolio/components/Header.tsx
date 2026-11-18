"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";

export default function Header() {
  const { t, lang, setLang } = useLang();
  const path = usePathname();
  const nav = [
    { href: "/", label: t.cockpit, ready: true },
    { href: "/copilot", label: t.copilot, ready: false },
    { href: "/board-pack", label: t.boardPack, ready: false },
    { href: "/signals", label: t.signals, ready: false },
  ];

  return (
    <header className="bg-primary text-primary-fg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/alhail-mark.png" alt="Al Hail Holding" width={29} height={36} priority />
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-wide">{t.brand}</div>
            <div className="text-xs text-highlight">{t.product}</div>
          </div>
        </Link>
        <nav className="flex gap-1 text-sm">
          {nav.map((n) =>
            n.ready ? (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-1.5 ${
                  path === n.href || (n.href === "/" && path.startsWith("/business"))
                    ? "bg-white/15 font-semibold"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {n.label}
              </Link>
            ) : (
              <span key={n.href} title={t.comingSoon} className="cursor-not-allowed rounded-md px-3 py-1.5 text-white/40">
                {n.label}
              </span>
            ),
          )}
        </nav>
        <div className="ms-auto flex items-center gap-3 text-xs">
          <span className="rounded-full border border-accent/60 px-2.5 py-1 text-accent">{t.simulated}</span>
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="rounded-md border border-white/30 px-3 py-1.5 font-semibold hover:bg-white/10"
          >
            {lang === "en" ? "العربية" : "English"}
          </button>
        </div>
      </div>
    </header>
  );
}
