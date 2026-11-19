export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-brand-soft ${className}`}
      aria-hidden
    />
  );
}

export function RouteListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="surface space-y-0 overflow-hidden p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line px-2 py-3 last:border-0">
          <Skeleton className="h-11 w-11 shrink-0 rounded-[0.8rem]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="surface p-5">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="mt-3 h-3.5 w-3/4" />
      <Skeleton className="mt-5 h-11 w-full rounded-full" />
      <Skeleton className="mt-3 h-11 w-full rounded-full" />
    </div>
  );
}
