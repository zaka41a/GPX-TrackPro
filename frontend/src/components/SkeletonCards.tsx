export function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-surface rounded-xl p-5">
          <div className="skeleton-shimmer h-3 w-20 rounded mb-3" />
          <div className="skeleton-shimmer h-7 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonActivityList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-surface rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer h-9 w-9 rounded-lg" />
            <div>
              <div className="skeleton-shimmer h-4 w-32 rounded mb-2" />
              <div className="skeleton-shimmer h-3 w-20 rounded" />
            </div>
          </div>
          <div className="text-right">
            <div className="skeleton-shimmer h-4 w-16 rounded mb-2 ml-auto" />
            <div className="skeleton-shimmer h-3 w-12 rounded ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass-surface rounded-xl p-4 space-y-3">
      <div className="flex gap-4 pb-3 border-b border-border/30">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-3 w-20 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="skeleton-shimmer h-4 w-full rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
