export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `${res.status} ${path}`);
  }
  return res.json();
}

export type Rag = "green" | "amber" | "red";
export type Lang = "en" | "ar";

/** Pick the Arabic field when the UI is in Arabic and the field exists. */
export const tr = <T extends Record<string, unknown>>(o: T, key: string, lang: Lang): string =>
  String((lang === "ar" && o[`${key}_ar`]) || o[key] || "");

export type Sector = { id: string; name_en: string; name_ar: string; color: string; sort: number };

export type BusinessSummary = {
  id: string;
  sector_id: string;
  name_en: string;
  name_ar: string;
  location: string;
  location_ar: string;
  relationship: string;
  relationship_ar: string;
  revenue: number;
  revenue_var_pct: number;
  ebitda: number;
  ebitda_var_pct: number;
  flags: number;
  rag: Rag;
  trend: { period: string; actual: number; budget: number }[];
  reason: string | null;
  reason_ar: string | null;
};

export type Overview = {
  period: string;
  sectors: Sector[];
  businesses: BusinessSummary[];
  totals: { revenue: number; ebitda: number; ebitda_budget: number; amber_or_red: number };
};

export type Signal = {
  date: string;
  business_id?: string;
  sector_id?: string;
  name_en?: string;
  name_ar?: string;
  source: string;
  source_ar: string;
  summary: string;
  summary_ar: string;
  severity: "info" | "watch" | "alert";
};

export type MetricRow = { period: string; metric: string; label: string; unit: string; actual: number; budget: number };

export type BusinessDetail = {
  business: {
    id: string;
    name_en: string;
    name_ar: string;
    location: string;
    location_ar: string;
    relationship: string;
    relationship_ar: string;
    description: string;
    description_ar: string;
    facts: string[];
    source_url: string;
    sector_en: string;
    sector_ar: string;
    color: string;
  };
  metrics: MetricRow[];
  signals: Signal[];
  loans: {
    ref: string;
    borrower: string;
    sector: string;
    outstanding_aed_m: number;
    dpd: number;
    dscr: number;
    dscr_min: number;
    status: string;
  }[];
  exposure: { country: string; period: string; carrying_value_aed_m: number; note: string }[];
  documents: { id: number; title: string; filename: string; period: string; pages: number }[];
};

export type BoardPack = {
  period: string;
  lang: Lang;
  quarter_end: string;
  prepared: string;
  generated_by: string;
  summary: string[];
  performance: {
    id: string;
    name: string;
    sector: string;
    rag: Rag;
    revenue: number;
    revenue_var_pct: number;
    ebitda: number;
    ebitda_var_pct: number;
    cite: string | null;
  }[];
  commentary: { id: string; name: string; rag: Rag; ebitda_var_pct: number; text: string; cite: string | null }[];
  risks: { business: string; severity: "info" | "watch" | "alert"; risk: string; action: string; owner: string; cite: string | null }[];
  sectors: { id: string; name: string; color: string; revenue: number; revenue_var_pct: number; ebitda: number; ebitda_var_pct: number; businesses: string[] }[];
  sources: { id: number; cite: string; title: string }[];
};

export const fmt = (n: number, digits = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
