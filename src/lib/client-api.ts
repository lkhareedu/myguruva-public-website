import type { ListFilters, SuggestResult, CompareRow } from "./api-service";
import type { InstitutionCard } from "./mock-data";

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
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

export function fetchSuggest(q: string): Promise<SuggestResult> {
  return apiGet(`/v1/suggest?q=${encodeURIComponent(q)}`);
}

export function fetchInstitutions(filters: ListFilters = {}): Promise<{
  items: InstitutionCard[];
  page: number;
  pageSize: number;
  total: number;
}> {
  return apiGet(`/v1/institutions${toQuery(filters)}`);
}

export function fetchCompare(slugs: string[]): Promise<{ items: CompareRow[] }> {
  return apiGet(`/v1/compare?slugs=${encodeURIComponent(slugs.join(","))}`);
}
