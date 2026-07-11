"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchCompare, fetchInstitutions, fetchSuggest } from "@/lib/client-api";
import {
  COMPARE_MAX,
  useCompare,
  useHydrateCompareFromCsv,
  type CompareItem,
} from "@/lib/compare-store";
import type { CompareRow } from "@/lib/api-service";

export function ComparePageClient() {
  return (
    <Suspense fallback={<div className="container-page py-10 text-muted-foreground">Loading…</div>}>
      <CompareInner />
    </Suspense>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const legacySlugs = searchParams.get("slugs") ?? "";
  const { items: selected, remove, clear, isFull, add, hydrated } = useCompare();

  useHydrateCompareFromCsv(legacySlugs || null, (slug) => ({
    slug,
    name: slug,
    city: null,
    state: null,
  }));

  const slugs = selected.map((s) => s.slug);
  const compareQuery = useQuery({
    queryKey: ["compare", slugs],
    queryFn: () => fetchCompare(slugs),
    enabled: hydrated && slugs.length > 0,
    placeholderData: keepPreviousData,
  });

  const items: CompareRow[] = compareQuery.data?.items ?? [];
  const droppedCount = hydrated ? selected.length - items.length : 0;

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Compare colleges</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified institutions only · Pick up to {COMPARE_MAX}
          </p>
        </div>
        {selected.length > 0 && (
          <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted" onClick={() => clear()}>
            Clear all
          </button>
        )}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <SearchToAdd
          onAdd={(item) => add(item)}
          disabled={isFull}
          alreadyIn={(slug) => selected.some((s) => s.slug === slug)}
        />
        <SelectedTray items={selected} onRemove={remove} hydrated={hydrated} />
      </div>

      {droppedCount > 0 && !compareQuery.isFetching ? (
        <div className="mb-4 rounded-md border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          {droppedCount} of your picks are not Verified and were excluded from the comparison.
        </div>
      ) : null}

      {!hydrated ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          Loading your compare list…
        </div>
      ) : selected.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <div className="font-display text-xl">Your compare list is empty</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Search above, or add colleges from any listing or detail page. Your picks are saved to this device.
          </p>
          <Link
            href="/colleges?verified=true"
            className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Browse Verified colleges
          </Link>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          {compareQuery.isFetching
            ? "Loading comparison…"
            : "None of your picks are Verified. Add Verified colleges to compare."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-muted/60">
                <th className="sticky left-0 z-10 bg-muted/60 px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Metric
                </th>
                {items.map((r) => (
                  <th key={r.id} className="px-4 py-3 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/colleges/${r.slug}`} className="font-display text-base text-foreground hover:text-primary">
                          {r.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {[r.city, r.state].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <button
                        onClick={() => remove(r.slug)}
                        title="Remove"
                        aria-label={`Remove ${r.name}`}
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground hover:bg-background hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRowUI label="Type" values={items.map((r) => r.institutionType.label)} />
              <CompareRowUI label="Ownership" values={items.map((r) => r.ownership.label)} />
              <CompareRowUI label="Established" values={items.map((r) => r.establishedYear ?? "—")} />
              <CompareRowUI label="NAAC" values={items.map((r) => r.naacGrade.label)} />
              <CompareRowUI label="NIRF overall" values={items.map((r) => r.latestOverallRank ?? "—")} />
              <CompareRowUI label="NIRF engineering" values={items.map((r) => r.latestEngineeringRank ?? "—")} />
              <CompareRowUI label="Tuition (₹/yr)" values={items.map((r) => range(r.tuitionMin, r.tuitionMax))} />
              <CompareRowUI label="Total seats" values={items.map((r) => r.totalSeatsSum ?? "—")} />
              <CompareRowUI
                label="Placement %"
                values={items.map((r) => (r.placementPct != null ? `${r.placementPct}%` : "—"))}
              />
              <CompareRowUI
                label="Avg package"
                values={items.map((r) =>
                  r.avgPackage != null ? `₹${(r.avgPackage / 100000).toFixed(1)}L` : "—",
                )}
              />
              <CompareRowUI
                label="Campus"
                values={items.map((r) => (r.campusSizeAcres != null ? `${r.campusSizeAcres} ac` : "—"))}
              />
              <CompareRowUI label="Wi-Fi" values={items.map((r) => (r.hasWifi ? "✓" : "—"))} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SearchToAdd({
  onAdd,
  disabled,
  alreadyIn,
}: {
  onAdd: (item: CompareItem) => { ok: boolean };
  disabled: boolean;
  alreadyIn: (slug: string) => boolean;
}) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["compare-suggest", debounced],
    queryFn: () => fetchSuggest(debounced),
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const { data: fullList } = useQuery({
    queryKey: ["compare-full", debounced],
    queryFn: () =>
      fetchInstitutions({ q: debounced, verified: true, pageSize: 8, sort: "relevance" }),
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const verifiedFromFull = (fullList?.items ?? []).map((i) => ({
    slug: i.slug,
    name: i.name,
    city: i.city,
    state: i.state,
    verified: i.verified,
  }));
  const seen = new Set(verifiedFromFull.map((c) => c.slug));
  const fromSuggest = (data?.colleges ?? []).filter((c) => !seen.has(c.slug));
  const combined = [...verifiedFromFull, ...fromSuggest];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Find & add colleges
      </div>
      <div ref={ref} className="relative">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:border-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search Verified colleges by name or city…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search colleges to add"
            autoComplete="off"
          />
          {q ? (
            <button
              onClick={() => {
                setQ("");
                setDebounced("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              ✕
            </button>
          ) : null}
        </div>

        {open && debounced.length >= 2 ? (
          <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 max-h-80 overflow-auto rounded-xl border border-border bg-popover shadow-lg">
            {isFetching && combined.length === 0 ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="h-9 animate-pulse rounded-md bg-primary/10" />
                ))}
              </div>
            ) : combined.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                No Verified colleges match &quot;{debounced}&quot;.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {combined.map((c) => {
                  const inList = alreadyIn(c.slug);
                  const canAdd = c.verified && !inList && !disabled;
                  return (
                    <li key={c.slug} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[c.city, c.state].filter(Boolean).join(", ")}
                          {!c.verified ? " · Not Verified" : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!canAdd) return;
                          onAdd({ slug: c.slug, name: c.name, city: c.city, state: c.state });
                        }}
                        disabled={!canAdd}
                        className={
                          "shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium " +
                          (inList
                            ? "border-primary bg-primary/10 text-primary"
                            : canAdd
                              ? "border-border hover:border-primary hover:text-primary"
                              : "border-border text-muted-foreground opacity-60")
                        }
                      >
                        {inList ? "Added" : !c.verified ? "Not Verified" : disabled ? "Full" : "+ Add"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
      {disabled ? (
        <div className="mt-2 text-xs text-muted-foreground">
          You&apos;ve reached the maximum of {COMPARE_MAX} colleges. Remove one to add another.
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">
          Type at least 2 characters. Only Verified colleges can be compared.
        </div>
      )}
    </div>
  );
}

function SelectedTray({
  items,
  onRemove,
  hydrated,
}: {
  items: CompareItem[];
  onRemove: (slug: string) => void;
  hydrated: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Selected</div>
        <div className="text-xs text-muted-foreground">
          {hydrated ? `${items.length}/${COMPARE_MAX}` : `0/${COMPARE_MAX}`}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: COMPARE_MAX }).map((_, idx) => {
          const it = items[idx];
          if (!it) {
            return (
              <div
                key={idx}
                className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground"
              >
                Empty
              </div>
            );
          }
          return (
            <div
              key={it.slug}
              className="group relative flex h-20 flex-col justify-between rounded-lg border border-border bg-background p-2"
            >
              <Link href={`/colleges/${it.slug}`} className="line-clamp-2 text-xs font-medium hover:text-primary">
                {it.name}
              </Link>
              <div className="truncate text-[10px] text-muted-foreground">
                {[it.city, it.state].filter(Boolean).join(", ") || "—"}
              </div>
              <button
                onClick={() => onRemove(it.slug)}
                aria-label={`Remove ${it.name}`}
                className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] text-muted-foreground opacity-0 ring-1 ring-border transition group-hover:opacity-100 hover:text-foreground"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareRowUI({ label, values }: { label: string; values: (string | number)[] }) {
  return (
    <tr className="border-t border-border">
      <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </th>
      {values.map((v, idx) => (
        <td key={idx} className="px-4 py-3">
          {v}
        </td>
      ))}
    </tr>
  );
}

function range(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  const f = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString()}`);
  if (min != null && max != null) return `${f(min)} – ${f(max)}`;
  return f((min ?? max)!);
}
