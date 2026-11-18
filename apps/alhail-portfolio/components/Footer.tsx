"use client";

import { useLang } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-muted sm:px-6">{t.footer}</div>
    </footer>
  );
}
