"use client";

import { Scale, Check, X } from "lucide-react";
import { useCompare, COMPARE_MAX, type CompareItem } from "@/lib/compare-store";
import { cn } from "@/lib/utils";

type Props = {
  item: CompareItem;
  verified: boolean;
  variant?: "button" | "icon";
  className?: string;
};

export function CompareToggle({ item, verified, variant = "button", className }: Props) {
  const { has, toggle, isFull, hydrated } = useCompare();
  const active = hydrated && has(item.slug);
  const disabled = !verified || (!active && isFull);

  const title = !verified
    ? "Only Verified colleges can be compared"
    : disabled
    ? `Compare list is full (${COMPARE_MAX} max)`
    : active
    ? "Remove from compare"
    : "Add to compare";

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!verified) return;
    toggle(item);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-pressed={active}
        aria-label={title}
        className={cn(
          "group/cmp inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
          active
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : disabled
            ? "border-border text-muted-foreground opacity-40"
            : "border-border bg-background text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary",
          className,
        )}
      >
        {active ? (
          <Check size={14} strokeWidth={3} />
        ) : (
          <Scale size={14} strokeWidth={2} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : disabled
          ? "border-border text-muted-foreground opacity-60"
          : "border-border bg-background hover:border-primary hover:text-primary",
        className,
      )}
    >
      {active ? <Check size={16} strokeWidth={3} /> : <Scale size={16} />}
      {active ? "Added to compare" : "Add to compare"}
      {active ? (
        <span
          role="button"
          onClick={onClick}
          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/15 hover:bg-primary-foreground/25"
          aria-label="Remove"
        >
          <X size={12} />
        </span>
      ) : null}
    </button>
  );
}
