"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCompare } from "@/lib/compare-store";

export function CompareBadge() {
  const { count } = useCompare();
  const pathname = usePathname();
  const active = pathname.startsWith("/compare");

  return (
    <Link
      href="/compare"
      className={
        active
          ? "relative inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-sm text-foreground"
          : "relative inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground"
      }
      aria-label={`Compare (${count})`}
    >
      <Scale size={16} aria-hidden />
      <span>Compare</span>
      {count > 0 ? (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
