"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchInstitutions, fetchSuggest } from "@/lib/client-api";
import { CollegeCard } from "@/components/college-card";
import { CollegeGridSkeleton } from "@/components/college-card-skeleton";

export function SearchPageClient() {
  return (
    <Suspense fallback={<div className="container-page py-10"><CollegeGridSkeleton count={4} /></div>}>
      <SearchInner />
    </Suspense>
  );
}

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1") || 1;

  const resultsQuery = useQuery({
    queryKey: ["search", q, page],
    queryFn: () => fetchInstitutions({ q, page, pageSize: 12, sort: "relevance" }),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });

  const suggestQuery = useQuery({
    queryKey: ["suggest", q],
    queryFn: () => fetchSuggest(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  });

  const data = resultsQuery.data;
  const showSkeleton = resultsQuery.isFetching && !data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="container-page py-10">
      <div className="mb-6">
        <div className="text-xs tracking-wider text-muted-foreground uppercase">Search results</div>
        <h1 className="font-display mt-1 text-4xl">
          {q ? (
            <>
              Results for <span className="text-primary">&quot;{q}&quot;</span>
            </>
          ) : (
            "Search"
          )}
        </h1>
        {data && !showSkeleton ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {data.total} {data.total === 1 ? "match" : "matches"}
          </p>
        ) : null}
      </div>

      {q ? (
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24 lg:self-start">
            <div>
              <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Refine
              </div>
              <div className="space-y-2 text-sm">
                <Link
                  href={`/colleges?q=${encodeURIComponent(q)}`}
                  className="block rounded-md border border-border px-3 py-2 hover:bg-muted"
                >
                  Full filters →
                </Link>
              </div>
            </div>
            {(suggestQuery.data?.streams?.length ?? 0) > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Streams
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestQuery.data!.streams.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/colleges?stream=${encodeURIComponent(s.name)}`}
                      className="chip hover:bg-muted"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {(suggestQuery.data?.cities?.length ?? 0) > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Cities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestQuery.data!.cities.map((c) => (
                    <Link
                      key={c}
                      href={`/colleges?city=${encodeURIComponent(c)}`}
                      className="chip hover:bg-muted"
                    >
                      {c}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section>
            {showSkeleton ? (
              <CollegeGridSkeleton count={6} />
            ) : data && data.items.length > 0 ? (
              <>
                <div className="college-results-grid">
                  {data.items.map((i) => (
                    <CollegeCard key={i.id} i={i} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const p = idx + 1;
                      const active = p === page;
                      return (
                        <button
                          key={p}
                          onClick={() =>
                            router.push(`/search?q=${encodeURIComponent(q)}&page=${p}`)
                          }
                          className={
                            "rounded-md border px-3 py-1.5 text-sm " +
                            (active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:bg-muted")
                          }
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                No colleges match &quot;{q}&quot;. Try a different query or{" "}
                <Link href="/colleges" className="text-primary hover:underline">
                  browse all colleges
                </Link>
                .
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          Type a query in the search bar to get started.
        </div>
      )}
    </div>
  );
}
