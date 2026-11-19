export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-brand/10 ${className}`}
      aria-hidden
    />
  );
}

export function RouteListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-3xl border border-line bg-white/55 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-line bg-white/65 p-5">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-5 h-12 w-full rounded-2xl" />
      <Skeleton className="mt-3 h-12 w-full rounded-2xl" />
    </div>
  );
}
