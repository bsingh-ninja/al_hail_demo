"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "ar";

const DICT = {
  en: {
    brand: "Al Hail Holding",
    product: "Group Portfolio Copilot",
    cockpit: "Portfolio",
    copilot: "Copilot",
    boardPack: "Board pack",
    signals: "Signals",
    simulated: "Simulated data",
    period: "Period",
    groupRevenue: "Group revenue",
    groupEbitda: "Group EBITDA",
    vsBudget: "vs budget",
    businesses: "Businesses",
    needAttention: "Need attention",
    aedM: "AED m",
    revenue: "Revenue",
    ebitda: "EBITDA",
    flag: "flag",
    flags: "flags",
    latestSignals: "Latest signals",
    back: "Back to portfolio",
    publicFacts: "Public facts",
    source: "Source",
    relationship: "Relationship",
    trend: "Revenue and EBITDA vs budget",
    actual: "Actual",
    budget: "Budget",
    kpis: "Key indicators",
    loanBook: "Loan book: exceptions first",
    exposure: "Country exposure (carrying value)",
    borrower: "Borrower",
    outstanding: "Outstanding",
    dpd: "Days past due",
    dscr: "DSCR (min)",
    status: "Status",
    country: "Country",
    note: "Note",
    footer: "Prepared for Al Hail Holding by NinjaTech · Public figures link to their source; all quarterly figures are simulated for demonstration.",
    comingSoon: "Coming in the next phase",
    documents: "Source documents",
    pages: "pages",
    rag: { green: "On track", amber: "Watch", red: "Off track" },
    severity: { info: "Info", watch: "Watch", alert: "Alert" },
  },
  ar: {
    brand: "الحيل القابضة",
    product: "مساعد المحفظة الذكي للمجموعة",
    cockpit: "المحفظة",
    copilot: "المساعد الذكي",
    boardPack: "حزمة مجلس الإدارة",
    signals: "الإشارات",
    simulated: "بيانات محاكاة",
    period: "الفترة",
    groupRevenue: "إيرادات المجموعة",
    groupEbitda: "الأرباح قبل الفوائد والضرائب والإهلاك",
    vsBudget: "مقابل الميزانية",
    businesses: "الشركات",
    needAttention: "تحتاج إلى متابعة",
    aedM: "مليون درهم",
    revenue: "الإيرادات",
    ebitda: "EBITDA",
    flag: "تنبيه",
    flags: "تنبيهات",
    latestSignals: "أحدث الإشارات",
    back: "العودة إلى المحفظة",
    publicFacts: "معلومات منشورة",
    source: "المصدر",
    relationship: "طبيعة العلاقة",
    trend: "الإيرادات وEBITDA مقابل الميزانية",
    actual: "الفعلي",
    budget: "الميزانية",
    kpis: "المؤشرات الرئيسية",
    loanBook: "محفظة القروض: الاستثناءات أولاً",
    exposure: "التعرض حسب الدولة (القيمة الدفترية)",
    borrower: "المقترض",
    outstanding: "الرصيد القائم",
    dpd: "أيام التأخر",
    dscr: "نسبة تغطية خدمة الدين (الحد الأدنى)",
    status: "الحالة",
    country: "الدولة",
    note: "ملاحظة",
    footer: "أُعدّ لشركة الحيل القابضة بواسطة NinjaTech · الأرقام المنشورة مرتبطة بمصادرها؛ جميع الأرقام الفصلية محاكاة لأغراض العرض.",
    comingSoon: "قادم في المرحلة التالية",
    documents: "المستندات المصدرية",
    pages: "صفحات",
    rag: { green: "ضمن المسار", amber: "متابعة", red: "خارج المسار" },
    severity: { info: "معلومة", watch: "متابعة", alert: "تنبيه" },
  },
} as const;

export type Dict = (typeof DICT)["en"];

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void }>({
  lang: "en",
  t: DICT.en as Dict,
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl === "ar" || fromUrl === "en") return setLangState(fromUrl);
    try {
      const saved = localStorage.getItem("alhail-lang");
      if (saved === "ar" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("alhail-lang", l);
    } catch {}
  };

  return <LangContext.Provider value={{ lang, t: DICT[lang] as Dict, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
