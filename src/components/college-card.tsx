"use client";

import Link from "next/link";
import type { InstitutionCard } from "@/lib/mock-data";
import { CompareToggle } from "./compare-toggle";

function formatFees(min: number | null, max: number | null) {
  if (min == null && max == null) return "—";
  const f = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}k`);
  if (min != null && max != null) return `${f(min)} – ${f(max)}/yr`;
  return `${f((min ?? max)!)}/yr`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--verified)]/10 px-2 py-0.5 text-[11px] font-medium text-[color:var(--verified)] ring-1 ring-[color:var(--verified)]/20 ring-inset">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.5 4.9 5.5.9-4 3.9.9 5.4L12 14.8 7.1 17l.9-5.4L4 7.8l5.5-.9L12 2z" />
      </svg>
      Verified
    </span>
  );
}

export function CollegeCard({ i }: { i: InstitutionCard }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card transition hover:border-primary/40">
      <Link href={`/colleges/${i.slug}`} className="group flex min-w-0 flex-1 flex-col p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary"
          >
            {i.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              initials(i.name)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 font-display text-base leading-snug text-foreground group-hover:text-primary">
                {i.name}
              </h3>
              {i.verified ? <VerifiedBadge /> : null}
            </div>
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {[i.city, i.state].filter(Boolean).join(", ")}
              {i.establishedYear ? ` · est. ${i.establishedYear}` : ""}
            </div>
          </div>
        </div>

        {i.shortDescription ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {i.shortDescription}
          </p>
        ) : (
          <div className="mt-3 flex-1" />
        )}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
          <span className="chip">{i.institutionType.label}</span>
          <span className="chip">{i.ownership.label}</span>
          {i.naacGrade.label !== "—" && i.naacGrade.label ? (
            <span className="chip">NAAC {i.naacGrade.label}</span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="truncate">{formatFees(i.tuitionMin, i.tuitionMax)}</span>
          <span className="shrink-0">
            {i.latestOverallRank != null ? `NIRF #${i.latestOverallRank}` : "Rank —"}
          </span>
        </div>
      </Link>

      <div className="flex items-center justify-end border-t border-border/60 px-3 py-2">
        <CompareToggle
          item={{ slug: i.slug, name: i.name, city: i.city, state: i.state }}
          verified={i.verified}
          variant="icon"
        />
      </div>
    </article>
  );
}
