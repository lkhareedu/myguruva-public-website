import { Skeleton } from "@/components/ui/skeleton";

export function CollegeCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="mt-3 flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="mt-3 flex justify-between border-t border-border/60 pt-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="border-t border-border/60 px-3 py-2">
        <Skeleton className="ml-auto h-7 w-7 rounded-md" />
      </div>
    </div>
  );
}

export function CollegeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CollegeCardSkeleton key={i} />
      ))}
    </div>
  );
}
