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
    businesses: "businesses",
    needAttention: "Needs attention",
    groupPortfolio: "Group portfolio",
    onTrack: "On track",
    bySector: "Portfolio by sector",
    headline: (n: number, total: number) =>
      n === 0 ? `All ${total} businesses are on track this quarter` : `${n} of ${total} businesses need attention this quarter`,
    theme: "Switch theme",
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
    footer: "Prepared for Al Hail Holding by NinjaTech. Public figures link to their source; all quarterly figures are simulated for demonstration.",
    comingSoon: "Coming in the next phase",
    quarter: (p: string) => `Quarter ${p}`,
    boardPackIntro: "Draft the quarterly board pack from this quarter's figures and source documents. Every statement links to its source.",
    draftPack: "Draft board pack",
    redraftPack: "Redraft",
    drafting: "Drafting the board pack…",
    downloadDocx: "Download Word file",
    packEmpty: "No board pack drafted for this quarter yet. Draft one to see the preview here.",
    packTitle: "Quarterly board pack",
    packSubtitle: (end: string) => `Group portfolio review for the quarter ended ${end}`,
    packDraft: "Draft for board office review",
    packPrepared: (d: string) => `Prepared ${d}`,
    packByAi: (m: string) => `Executive summary written by ${m} from the cited facts`,
    packByTemplate: "Executive summary drafted from a template. Add a Gemini key for an AI-written summary.",
    s1: "Executive summary",
    s2: "Portfolio performance",
    s3: "Business commentary",
    s4: "Risks and actions",
    s5: "Sector view",
    sources: "Sources",
    business: "Business",
    risk: "Risk",
    actionAgreed: "Action agreed",
    owner: "Owner",
    sector: "Sector",
    signalsIntro: "Risk and news signals across the 12 businesses, newest first.",
    allSeverities: "All",
    allBusinesses: "All businesses",
    noSignals: "No signals match these filters.",
    showing: (n: number, total: number) => `Showing ${n} of ${total}`,
    documents: "Source documents",
    copilotIntro: "Ask about performance, risks and exposure across the 12 businesses. Every number is cited to its source.",
    askPlaceholder: "Ask a question in English or Arabic…",
    ask: "Ask",
    thinking: "Analysing the portfolio…",
    page: "page",
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
    businesses: "شركة",
    needAttention: "تحتاج إلى متابعة",
    groupPortfolio: "محفظة المجموعة",
    onTrack: "ضمن المسار",
    bySector: "المحفظة حسب القطاع",
    headline: (n: number, total: number) =>
      n === 0 ? `جميع الشركات الـ${total} ضمن المسار هذا الربع` : `${n} من ${total} شركة تحتاج إلى متابعة هذا الربع`,
    theme: "تبديل المظهر",
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
    footer: "أُعدّ لشركة الحيل القابضة بواسطة NinjaTech. الأرقام المنشورة مرتبطة بمصادرها؛ جميع الأرقام الفصلية محاكاة لأغراض العرض.",
    comingSoon: "قادم في المرحلة التالية",
    quarter: (p: string) => `الربع ${p}`,
    boardPackIntro: "صِغ حزمة مجلس الإدارة الفصلية من أرقام هذا الربع ومستنداته المصدرية. كل عبارة مرتبطة بمصدرها.",
    draftPack: "صياغة حزمة مجلس الإدارة",
    redraftPack: "إعادة الصياغة",
    drafting: "جارٍ صياغة حزمة مجلس الإدارة…",
    downloadDocx: "تنزيل ملف Word",
    packEmpty: "لم تُصغ حزمة مجلس الإدارة لهذا الربع بعد. اصغها لتظهر المعاينة هنا.",
    packTitle: "حزمة مجلس الإدارة الفصلية",
    packSubtitle: (end: string) => `مراجعة محفظة المجموعة للربع المنتهي في ${end}`,
    packDraft: "مسودة لمراجعة مكتب مجلس الإدارة",
    packPrepared: (d: string) => `أُعدّت في ${d}`,
    packByAi: (m: string) => `كتب ${m} الملخص التنفيذي من الحقائق الموثقة`,
    packByTemplate: "صيغ الملخص التنفيذي من قالب. أضف مفتاح Gemini للحصول على ملخص مكتوب بالذكاء الاصطناعي.",
    s1: "الملخص التنفيذي",
    s2: "أداء المحفظة",
    s3: "تعليقات الشركات",
    s4: "المخاطر والإجراءات",
    s5: "نظرة على القطاعات",
    sources: "المصادر",
    business: "الشركة",
    risk: "الخطر",
    actionAgreed: "الإجراء المتفق عليه",
    owner: "المسؤول",
    sector: "القطاع",
    signalsIntro: "إشارات المخاطر والأخبار عبر الشركات الاثنتي عشرة، الأحدث أولاً.",
    allSeverities: "الكل",
    allBusinesses: "جميع الشركات",
    noSignals: "لا توجد إشارات تطابق هذه المرشحات.",
    showing: (n: number, total: number) => `عرض ${n} من ${total}`,
    documents: "المستندات المصدرية",
    copilotIntro: "اسأل عن الأداء والمخاطر والتعرض عبر الشركات الاثنتي عشرة. كل رقم موثّق بمصدره.",
    askPlaceholder: "اكتب سؤالك بالعربية أو الإنجليزية…",
    ask: "اسأل",
    thinking: "جارٍ تحليل المحفظة…",
    page: "صفحة",
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
