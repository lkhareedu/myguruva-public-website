import { Skeleton } from "@/components/ui/skeleton";

export function CollegeCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-2.5 border-b border-border/60 px-3.5 pt-3.5 pb-2.5">
        <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3.5 pt-2.5 pb-3.5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="mt-3 flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="mt-2.5 flex justify-between border-t border-border/60 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function CollegeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="college-results-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CollegeCardSkeleton key={i} />
      ))}
    </div>
  );
}
