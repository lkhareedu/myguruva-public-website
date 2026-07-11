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
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color:var(--verified)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--verified)] ring-1 ring-[color:var(--verified)]/20 ring-inset">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.5 4.9 5.5.9-4 3.9.9 5.4L12 14.8 7.1 17l.9-5.4L4 7.8l5.5-.9L12 2z" />
      </svg>
      Verified
    </span>
  );
}

export function CollegeCard({ i }: { i: InstitutionCard }) {
  const blurb = teaser(i.shortDescription, 90);

  return (
    <article className="college-card transition hover:border-primary/35">
      <div className="flex min-w-0 items-start gap-2.5 px-3.5 pt-3.5 pb-2">
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
          <div className="flex min-w-0 items-start gap-2">
            <Link href={`/colleges/${i.slug}`} className="min-w-0 flex-1 group">
              <h3 className="line-clamp-2 font-display text-[0.92rem] leading-snug text-foreground group-hover:text-primary">
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
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="min-w-0 truncate">
              {[i.city, i.state].filter(Boolean).join(", ")}
              {i.establishedYear ? ` · ${i.establishedYear}` : ""}
            </span>
            {i.verified ? <VerifiedBadge /> : null}
          </div>
        </div>
      </div>

      <Link href={`/colleges/${i.slug}`} className="flex min-w-0 flex-1 flex-col px-3.5 pb-3.5">
        {blurb ? (
          <p
            className="mt-1 min-h-[2.5rem] min-w-0 text-[12.5px] leading-snug text-muted-foreground"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {blurb}
          </p>
        ) : (
          <div className="mt-1 min-h-[2.5rem] flex-1" />
        )}

        <div className="mt-2.5 flex min-w-0 flex-wrap gap-1">
          <span className="chip max-w-[9.5rem] truncate">{i.institutionType.label}</span>
          <span className="chip truncate">{i.ownership.label}</span>
          {i.naacGrade?.label && i.naacGrade.label !== "—" ? (
            <span className="chip">NAAC {i.naacGrade.label}</span>
          ) : null}
        </div>

        <div className="mt-2.5 flex min-w-0 items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
          <span className="min-w-0 truncate font-medium text-foreground/80">
            {formatFees(i.tuitionMin, i.tuitionMax)}
          </span>
          <span className="shrink-0 tabular-nums">
            {i.latestOverallRank != null ? `NIRF #${i.latestOverallRank}` : "Rank —"}
          </span>
        </div>
      </Link>
    </article>
  );
}
