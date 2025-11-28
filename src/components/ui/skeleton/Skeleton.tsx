import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string | number;
  width?: string | number;
  circle?: boolean;
  variant?: 'text' | 'rectangular' | 'circular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  count = 1,
  height = '1rem',
  width = '100%',
  variant = 'rectangular',
}) => {
  const baseClasses =
    'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: `rounded`,
    circular: 'rounded-full',
  };

  const skeletonClass = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const style: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
  };

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={skeletonClass} style={style} />
        ))}
      </div>
    );
  }

  return <div className={skeletonClass} style={style} />;
};

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 6, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} height={40} variant="text" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} height={32} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-800 p-4 ${className}`}>
      <Skeleton height={24} width="40%" className="mb-4" />
      <Skeleton height={16} width="100%" count={3} />
    </div>
  );
};

export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <Skeleton height={16} width="60%" className="mb-3" />
            <Skeleton height={32} width="50%" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <Skeleton height={24} width="30%" className="mb-4" />
        <SkeletonTable rows={5} columns={6} />
      </div>
    </div>
  );
};

export const SkeletonDataTable: React.FC<{
  rows?: number;
  columns?: number;
  showTitle?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 6, showTitle = true, className = '' }) => {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="p-6">
        {showTitle && (
          <>
            <Skeleton height={24} width="30%" className="mb-6" />
          </>
        )}
        <div className="space-y-4">
          {/* Header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} height={40} variant="text" />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={`row-${rowIdx}`}
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIdx) => (
                <Skeleton key={`cell-${rowIdx}-${colIdx}`} height={32} variant="text" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const SkeletonWithHeader: React.FC<{
  rows?: number;
  columns?: number;
  hasButton?: boolean;
  hasDatePicker?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 6, hasButton = false, hasDatePicker = false, className = '' }) => {
  return (
    <div className={`space-y-5 sm:space-y-6 ${className}`}>
      {/* Header with Button/DatePicker */}
      <div className="flex justify-between items-center">
        {hasButton && (
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        )}
        {hasDatePicker && (
          <div className="flex items-center gap-4 ml-auto">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-full sm:w-[250px] h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Table Skeleton */}
      <SkeletonDataTable rows={rows} columns={columns} showTitle={true} />
    </div>
  );
};
