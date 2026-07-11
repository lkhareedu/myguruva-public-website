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
    <Link
      href={`/colleges/${i.slug}`}
      className="group block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-[0_10px_30px_-15px_rgba(194,65,12,0.35)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-snug text-foreground group-hover:text-primary">
            {i.name}
          </h3>
          <div className="mt-1 text-xs text-muted-foreground">
            {[i.city, i.state].filter(Boolean).join(", ")}
            {i.establishedYear ? ` · est. ${i.establishedYear}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {i.verified ? <VerifiedBadge /> : null}
          <CompareToggle
            item={{ slug: i.slug, name: i.name, city: i.city, state: i.state }}
            verified={i.verified}
            variant="icon"
          />
        </div>
      </div>
      {i.shortDescription ? (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{i.shortDescription}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="chip">{i.institutionType.label}</span>
        <span className="chip">{i.ownership.label}</span>
        <span className="chip">NAAC {i.naacGrade.label}</span>
        {(i.tuitionMin != null || i.tuitionMax != null) && (
          <span className="chip">{formatFees(i.tuitionMin, i.tuitionMax)}</span>
        )}
        {i.latestOverallRank != null && <span className="chip">NIRF #{i.latestOverallRank}</span>}
      </div>
    </Link>
  );
}
