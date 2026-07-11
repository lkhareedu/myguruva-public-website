import type { ListFilters } from "@/lib/api-service";

export function parseNum(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseBool(v: string | null): boolean | undefined {
  if (v == null || v === "") return undefined;
  return v === "true" || v === "1";
}

export function filtersFromSearchParams(q: URLSearchParams): ListFilters {
  return {
    q: q.get("q") ?? undefined,
    state: q.get("state") ?? undefined,
    city: q.get("city") ?? undefined,
    institutionType: parseNum(q.get("institutionType")),
    ownership: parseNum(q.get("ownership")),
    naacGrade: parseNum(q.get("naacGrade")),
    stream: q.get("stream") ?? undefined,
    degreeLevel: parseNum(q.get("degreeLevel")),
    feeMin: parseNum(q.get("feeMin")),
    feeMax: parseNum(q.get("feeMax")),
    rankBand: q.get("rankBand") ?? undefined,
    verified: parseBool(q.get("verified")),
    featured: parseBool(q.get("featured")),
    page: parseNum(q.get("page")),
    pageSize: parseNum(q.get("pageSize")),
    sort: (q.get("sort") as ListFilters["sort"]) ?? undefined,
  };
}
