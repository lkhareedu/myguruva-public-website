"use client";

import Link from "next/link";
import type { InstitutionCard } from "@/lib/mock-data";
import { teaser } from "@/lib/text";
import { CompareToggle } from "./compare-toggle";

function formatFees(min: number | null, max: number | null) {
  if (min == null && max == null) return "Fees —";
  const f = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}k`);
  if (min != null && max != null) return `${f(min)}–${f(max)}/yr`;
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
    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--verified)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--verified)] ring-1 ring-[color:var(--verified)]/20 ring-inset">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.5 4.9 5.5.9-4 3.9.9 5.4L12 14.8 7.1 17l.9-5.4L4 7.8l5.5-.9L12 2z" />
      </svg>
      Verified
    </span>
  );
}

export function CollegeCard({ i }: { i: InstitutionCard }) {
  const blurb = teaser(i.shortDescription, 108);

  return (
    <article className="flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/35">
      <div className="flex min-w-0 items-start gap-2.5 border-b border-border/60 px-3.5 pt-3.5 pb-2.5">
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold tracking-wide text-primary"
        >
          {i.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={i.logoUrl} alt="" className="h-9 w-9 rounded-md object-cover" />
          ) : (
            initials(i.name)
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <Link href={`/colleges/${i.slug}`} className="min-w-0 flex-1 group">
              <h3 className="line-clamp-2 break-words font-display text-[0.95rem] leading-snug text-foreground group-hover:text-primary">
                {i.name}
              </h3>
            </Link>
            <CompareToggle
              item={{ slug: i.slug, name: i.name, city: i.city, state: i.state }}
              verified={i.verified}
              variant="icon"
              className="h-7 w-7 shrink-0"
            />
          </div>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="min-w-0 truncate">
              {[i.city, i.state].filter(Boolean).join(", ")}
              {i.establishedYear ? ` · ${i.establishedYear}` : ""}
            </span>
            {i.verified ? <VerifiedBadge /> : null}
          </div>
        </div>
      </div>

      <Link
        href={`/colleges/${i.slug}`}
        className="flex min-w-0 flex-1 flex-col overflow-hidden px-3.5 pt-2.5 pb-3.5"
      >
        {blurb ? (
          <p className="line-clamp-2 min-w-0 overflow-hidden break-words text-[13px] leading-snug text-muted-foreground [overflow-wrap:anywhere]">
            {blurb}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        <div className="mt-auto flex min-w-0 flex-wrap gap-1 pt-2.5">
          <span className="chip max-w-full truncate">{i.institutionType.label}</span>
          <span className="chip">{i.ownership.label}</span>
          {i.naacGrade?.label && i.naacGrade.label !== "—" ? (
            <span className="chip">NAAC {i.naacGrade.label}</span>
          ) : null}
        </div>

        <div className="mt-2.5 flex min-w-0 items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate font-medium text-foreground/80">
            {formatFees(i.tuitionMin, i.tuitionMax)}
          </span>
          <span className="shrink-0">
            {i.latestOverallRank != null ? `NIRF #${i.latestOverallRank}` : "Rank —"}
          </span>
        </div>
      </Link>
    </article>
  );
}
