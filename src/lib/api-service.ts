import type { InstitutionCard, InstitutionDetail } from "./mock-data";

export type SuggestResult = {
  colleges: Array<{
    slug: string;
    name: string;
    city: string | null;
    state: string | null;
    verified: boolean;
  }>;
  streams: Array<{ slug: string; name: string }>;
  cities: string[];
};

export type ListFilters = {
  q?: string;
  state?: string;
  city?: string;
  institutionType?: number;
  ownership?: number;
  naacGrade?: number;
  stream?: string;
  degreeLevel?: number;
  feeMin?: number;
  feeMax?: number;
  rankBand?: string;
  verified?: boolean;
  featured?: boolean;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "rank" | "fees" | "name";
};

export type CompareRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  institutionType: InstitutionCard["institutionType"];
  ownership: InstitutionCard["ownership"];
  establishedYear: number | null;
  naacGrade: InstitutionCard["naacGrade"];
  latestOverallRank: number | null;
  latestEngineeringRank: number | null;
  tuitionMin: number | null;
  tuitionMax: number | null;
  totalSeatsSum: number | null;
  placementPct: number | null;
  avgPackage: number | null;
  campusSizeAcres: number | null;
  hasWifi: boolean | null;
  verified: boolean;
};

function apiBase(): string {
  // Server: talk to middleware directly. Browser uses relative /v1 (Next rewrite).
  if (typeof window === "undefined") {
    return (process.env.PUBLIC_API_BASE_URL ?? "http://localhost:4100").replace(/\/$/, "");
  }
  return "";
}

async function apiGet<T>(path: string): Promise<T> {
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function toQuery(filters: ListFilters): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function suggestSearch(q: string): Promise<SuggestResult> {
  return apiGet(`/v1/suggest?q=${encodeURIComponent(q)}`);
}

export async function listStreams() {
  return apiGet<{ items: Array<{ id: string; name: string; shortName: string | null; slug: string }> }>(
    "/v1/taxonomies/streams",
  );
}

export async function listInstitutions(f: ListFilters = {}) {
  return apiGet<{
    items: InstitutionCard[];
    page: number;
    pageSize: number;
    total: number;
  }>(`/v1/institutions${toQuery(f)}`);
}

export async function getInstitutionBySlug(
  slug: string,
): Promise<
  | { kind: "detail"; data: InstitutionDetail }
  | { kind: "redirect"; primarySlug: string }
  | { kind: "notFound" }
> {
  const base = apiBase();
  const res = await fetch(`${base}/v1/institutions/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    redirect: "manual",
  });
  if (res.status === 404) return { kind: "notFound" };
  if (res.status === 301 || res.status === 302) {
    const loc = res.headers.get("location") ?? "";
    const m = loc.match(/\/institutions\/([^/?#]+)/);
    if (m) return { kind: "redirect", primarySlug: decodeURIComponent(m[1]) };
    return { kind: "notFound" };
  }
  if (!res.ok) throw new Error(`API institution failed: ${res.status}`);
  return { kind: "detail", data: (await res.json()) as InstitutionDetail };
}

export async function compareInstitutions(slugs: string[]) {
  return apiGet<{ items: CompareRow[] }>(
    `/v1/compare?slugs=${encodeURIComponent(slugs.join(","))}`,
  );
}

export async function sitemapInstitutions() {
  return apiGet<{ items: Array<{ slug: string; updatedAt: string }> }>("/v1/sitemap/institutions");
}
