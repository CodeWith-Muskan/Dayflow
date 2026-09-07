export const Skeleton = ({ className = "", style }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const TaskListSkeleton = ({ count = 4 }) => (
  <div className="task-list-skeleton">
    {Array.from({ length: count }).map((_, index) => (
      <div className="task-card-skeleton" key={index}>
        <Skeleton className="skeleton-check" />
        <div className="task-card-skeleton-lines">
          <Skeleton className="skeleton-line skeleton-line-title" />
          <Skeleton className="skeleton-line skeleton-line-sub" />
        </div>
      </div>
    ))}
  </div>
);

export const StatsSkeleton = ({ count = 4 }) => (
  <div className="stats-skeleton-grid">
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton className="skeleton-card" key={index} />
    ))}
  </div>
);