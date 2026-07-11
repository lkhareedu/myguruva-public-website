"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Suspense, useCallback, useMemo } from "react";
import { fetchInstitutions } from "@/lib/client-api";
import type { ListFilters } from "@/lib/api-service";
import { CollegeCard } from "@/components/college-card";
import { CollegeGridSkeleton } from "@/components/college-card-skeleton";
import { OPT } from "@/lib/option-sets";
import { STREAMS } from "@/lib/mock-data";

function parseFilters(sp: URLSearchParams): ListFilters {
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const bool = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return undefined;
    return v === "true" || v === "1" ? true : undefined;
  };
  const sort = sp.get("sort");
  return {
    q: sp.get("q") || undefined,
    state: sp.get("state") || undefined,
    city: sp.get("city") || undefined,
    institutionType: num("institutionType"),
    ownership: num("ownership"),
    naacGrade: num("naacGrade"),
    stream: sp.get("stream") || undefined,
    degreeLevel: num("degreeLevel"),
    feeMin: num("feeMin"),
    feeMax: num("feeMax"),
    rankBand: sp.get("rankBand") || undefined,
    verified: bool("verified"),
    featured: bool("featured"),
    page: num("page") ?? 1,
    pageSize: 12,
    sort: (sort as ListFilters["sort"]) || "relevance",
  };
}

function filtersToParams(f: ListFilters): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === "" || k === "pageSize") continue;
    if (k === "page" && v === 1) continue;
    if (k === "sort" && v === "relevance") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

function CollegesDirectoryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const setParam = useCallback(
    (patch: Record<string, unknown>) => {
      const next = { ...filters, page: 1, ...patch } as ListFilters;
      router.push(`/colleges${filtersToParams(next)}`);
    },
    [filters, router],
  );

  const query = useQuery({
    queryKey: ["institutions", filters],
    queryFn: () => fetchInstitutions(filters),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const showSkeleton = !data || (query.isFetching && query.isPlaceholderData);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="container-page py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl">Colleges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data ? `${data.total} ${data.total === 1 ? "college" : "colleges"}` : "Loading…"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
          <FilterInput label="Search" value={filters.q ?? ""} onChange={(v) => setParam({ q: v || undefined })} placeholder="Name, city, alias…" />
          <FilterInput label="State" value={filters.state ?? ""} onChange={(v) => setParam({ state: v || undefined })} />
          <FilterInput label="City" value={filters.city ?? ""} onChange={(v) => setParam({ city: v || undefined })} />
          <FilterSelect label="Institution type" value={filters.institutionType} onChange={(v) => setParam({ institutionType: v })} options={OPT.institutionType} />
          <FilterSelect label="Ownership" value={filters.ownership} onChange={(v) => setParam({ ownership: v })} options={OPT.ownership} />
          <FilterSelect label="NAAC grade" value={filters.naacGrade} onChange={(v) => setParam({ naacGrade: v })} options={OPT.naacGrade} />
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Stream</span>
            <select
              value={filters.stream ?? ""}
              onChange={(e) => setParam({ stream: e.target.value || undefined })}
              className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
            >
              <option value="">Any</option>
              {STREAMS.map((s) => (
                <option key={s.slug} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>
          <FilterSelect label="Degree level" value={filters.degreeLevel} onChange={(v) => setParam({ degreeLevel: v })} options={OPT.degreeLevel} />
          <div className="grid grid-cols-2 gap-2">
            <FilterInput label="Fee min (₹)" value={filters.feeMin?.toString() ?? ""} onChange={(v) => setParam({ feeMin: v ? Number(v) : undefined })} type="number" />
            <FilterInput label="Fee max (₹)" value={filters.feeMax?.toString() ?? ""} onChange={(v) => setParam({ feeMax: v ? Number(v) : undefined })} type="number" />
          </div>
          <FilterInput label="Rank band" value={filters.rankBand ?? ""} onChange={(v) => setParam({ rankBand: v || undefined })} placeholder="e.g. 1-10, 41-50" />
          <div className="flex flex-wrap gap-4 pt-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!filters.verified} onChange={(e) => setParam({ verified: e.target.checked || undefined })} />
              Verified only
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!filters.featured} onChange={(e) => setParam({ featured: e.target.checked || undefined })} />
              Featured
            </label>
          </div>
          <button onClick={() => router.push("/colleges")} className="w-full rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            Reset filters
          </button>
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{data ? `Page ${data.page} of ${totalPages}` : "Loading…"}</div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort</span>
              <select
                value={filters.sort ?? "relevance"}
                onChange={(e) => setParam({ sort: e.target.value })}
                className="rounded-md border border-border bg-card px-2 py-1"
              >
                <option value="relevance">Relevance</option>
                <option value="rank">Rank</option>
                <option value="fees">Fees</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>

          {showSkeleton ? (
            <CollegeGridSkeleton count={9} />
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No colleges match these filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.items.map((i) => (
                <CollegeCard key={i.id} i={i} />
              ))}
            </div>
          )}

          {data && totalPages > 1 && (
            <Pagination
              page={data.page}
              totalPages={totalPages}
              hrefForPage={(p) => `/colleges${filtersToParams({ ...filters, page: p })}`}
            />
          )}
        </section>
      </div>
    </div>
  );
}

export function CollegesDirectory() {
  return (
    <Suspense fallback={<div className="container-page py-10"><CollegeGridSkeleton count={6} /></div>}>
      <CollegesDirectoryInner />
    </Suspense>
  );
}

function FilterInput({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; options: Record<number, string> }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
      >
        <option value="">Any</option>
        {Object.entries(options).map(([v, lab]) => (
          <option key={v} value={v}>{lab}</option>
        ))}
      </select>
    </label>
  );
}

function pageWindow(page: number, totalPages: number): Array<number | "…"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  if (page <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (page >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function Pagination({
  page,
  totalPages,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  hrefForPage: (p: number) => string;
}) {
  const items = pageWindow(page, totalPages);
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <Link
        href={hrefForPage(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={
          "rounded-md border border-border px-3 py-1.5 text-sm " +
          (page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted")
        }
      >
        Previous
      </Link>
      {items.map((item, idx) =>
        item === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefForPage(item)}
            className={
              "min-w-9 rounded-md border px-3 py-1.5 text-center text-sm " +
              (item === page
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted")
            }
          >
            {item}
          </Link>
        ),
      )}
      <Link
        href={hrefForPage(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={
          "rounded-md border border-border px-3 py-1.5 text-sm " +
          (page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted")
        }
      >
        Next
      </Link>
    </nav>
  );
}
