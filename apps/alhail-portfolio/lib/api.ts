export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export type Rag = "green" | "amber" | "red";

export type Sector = { id: string; name_en: string; name_ar: string; color: string; sort: number };

export type BusinessSummary = {
  id: string;
  sector_id: string;
  name_en: string;
  name_ar: string;
  location: string;
  relationship: string;
  revenue: number;
  revenue_var_pct: number;
  ebitda: number;
  ebitda_var_pct: number;
  flags: number;
  rag: Rag;
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
  name_en?: string;
  name_ar?: string;
  source: string;
  summary: string;
  severity: "info" | "watch" | "alert";
};

export type MetricRow = { period: string; metric: string; label: string; unit: string; actual: number; budget: number };

export type BusinessDetail = {
  business: {
    id: string;
    name_en: string;
    name_ar: string;
    location: string;
    relationship: string;
    description: string;
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
};

export const fmt = (n: number, digits = 1) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
