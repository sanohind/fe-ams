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

export const SkeletonDeliveryPerformance: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Data Table with Filters */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Title and Actions Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton height={24} width={280} />
            <div className="flex items-center gap-3">
              {/* Month Select */}
              <Skeleton height={40} width={160} />
              {/* Year Select */}
              <Skeleton height={40} width={128} />
              {/* Download Button */}
              <Skeleton height={40} width={160} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <Skeleton height={40} width="100%" />
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={`header-${i}`} height={40} />
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div key={`row-${rowIdx}`} className="grid grid-cols-7 gap-4">
                {Array.from({ length: 7 }).map((_, colIdx) => (
                  <Skeleton key={`cell-${rowIdx}-${colIdx}`} height={60} />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Skeleton height={32} width={200} />
            <Skeleton height={32} width={150} />
          </div>
        </div>
      </div>

      {/* Number of Level Section */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-6">
        <Skeleton height={24} width={180} className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Card */}
          <div className="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
            <Skeleton height={20} width={100} className="mb-4" />
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
              <Skeleton height={12} width={40} />
              <Skeleton height={12} width={40} />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <Skeleton height={32} width={80} className="rounded-full" />
                  <Skeleton height={24} width={30} />
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Card */}
          <div className="rounded-2xl bg-gray-100 p-5 dark:bg-white/[0.03]">
            <Skeleton height={20} width={150} className="mb-4" />
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800 mb-4">
              <Skeleton height={12} width={40} />
              <Skeleton height={12} width={40} />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <Skeleton height={32} width={80} className="rounded-full" />
                  <Skeleton height={24} width={30} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Best Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Monthly */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <Skeleton height={24} width={200} className="mb-6" />
          <div className="my-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <Skeleton height={12} width={60} />
              <Skeleton height={12} width={40} />
            </div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="space-y-1">
                  <Skeleton height={16} width={100} />
                  <Skeleton height={12} width={80} />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton height={16} width={50} />
                  <Skeleton height={24} width={40} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Cumulative */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <Skeleton height={24} width={250} className="mb-6" />
          <div className="my-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <Skeleton height={12} width={60} />
              <Skeleton height={12} width={40} />
            </div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="space-y-1">
                  <Skeleton height={16} width={100} />
                  <Skeleton height={12} width={80} />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton height={16} width={50} />
                  <Skeleton height={24} width={40} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Worst Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worst Monthly */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <Skeleton height={24} width={200} className="mb-6" />
          <div className="my-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <Skeleton height={12} width={60} />
              <Skeleton height={12} width={40} />
            </div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="space-y-1">
                  <Skeleton height={16} width={100} />
                  <Skeleton height={12} width={80} />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton height={16} width={50} />
                  <Skeleton height={24} width={40} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Cumulative */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
          <Skeleton height={24} width={250} className="mb-6" />
          <div className="my-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <Skeleton height={12} width={60} />
              <Skeleton height={12} width={40} />
            </div>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div className="space-y-1">
                  <Skeleton height={16} width={100} />
                  <Skeleton height={12} width={80} />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton height={16} width={50} />
                  <Skeleton height={24} width={40} className="rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonArrivalSchedule: React.FC = () => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Date Picker Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Skeleton height={16} width={100} />
          <Skeleton height={40} width={250} />
        </div>
        <Skeleton height={40} width={160} />
      </div>

      {/* Regular Arrival Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Title and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton height={24} width={150} />
            <Skeleton height={40} width={300} />
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Header - 22 columns for all fields */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <Skeleton key={`header-${i}`} height={40} />
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div
                key={`row-${rowIdx}`}
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}
              >
                {Array.from({ length: 22 }).map((_, colIdx) => (
                  <Skeleton key={`cell-${rowIdx}-${colIdx}`} height={48} />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Skeleton height={32} width={200} />
            <Skeleton height={32} width={150} />
          </div>
        </div>
      </div>

      {/* Additional Arrival Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Title and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton height={24} width={180} />
            <Skeleton height={40} width={300} />
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Header */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <Skeleton key={`header2-${i}`} height={40} />
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 3 }).map((_, rowIdx) => (
              <div
                key={`row2-${rowIdx}`}
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}
              >
                {Array.from({ length: 22 }).map((_, colIdx) => (
                  <Skeleton key={`cell2-${rowIdx}-${colIdx}`} height={48} />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Skeleton height={32} width={200} />
            <Skeleton height={32} width={150} />
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <Skeleton height={24} width={250} className="mb-2" />
          <Skeleton height={16} width={500} />
        </div>

        <div className="p-4 sm:p-6">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Skeleton height={36} width={80} />
              <Skeleton height={36} width={80} />
              <Skeleton height={36} width={80} />
            </div>
            <Skeleton height={32} width={200} />
            <div className="flex gap-2">
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
              <Skeleton height={36} width={100} />
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={`day-${i}`} height={40} />
              ))}
            </div>

            {/* Calendar weeks */}
            {Array.from({ length: 5 }).map((_, weekIdx) => (
              <div key={`week-${weekIdx}`} className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div key={`day-${weekIdx}-${dayIdx}`} className="space-y-1">
                    <Skeleton height={80} />
                    {/* Some days have events */}
                    {(weekIdx + dayIdx) % 3 === 0 && (
                      <Skeleton height={24} width="90%" className="ml-1" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Skeleton height={16} width={16} className="rounded" />
              <Skeleton height={16} width={120} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton height={16} width={16} className="rounded" />
              <Skeleton height={16} width={140} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonDashboardPage: React.FC = () => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Summary Statistics Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-3">
                <Skeleton height={16} width="60%" />
                <Skeleton height={32} width="50%" />
              </div>
              <Skeleton height={48} width={48} className="rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Regular Arrival Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Title and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton height={24} width={150} />
            <Skeleton height={40} width={300} />
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Header - 22 columns */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <Skeleton key={`header-${i}`} height={40} />
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div
                key={`row-${rowIdx}`}
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}
              >
                {Array.from({ length: 22 }).map((_, colIdx) => (
                  <Skeleton key={`cell-${rowIdx}-${colIdx}`} height={48} />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Skeleton height={32} width={200} />
            <Skeleton height={32} width={150} />
          </div>
        </div>
      </div>

      {/* Additional Arrival Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Title and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Skeleton height={24} width={180} />
            <Skeleton height={40} width={300} />
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Header - 22 columns */}
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}>
              {Array.from({ length: 22 }).map((_, i) => (
                <Skeleton key={`header2-${i}`} height={40} />
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <div
                key={`row2-${rowIdx}`}
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(22, minmax(80px, 1fr))' }}
              >
                {Array.from({ length: 22 }).map((_, colIdx) => (
                  <Skeleton key={`cell2-${rowIdx}-${colIdx}`} height={48} />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Skeleton height={32} width={200} />
            <Skeleton height={32} width={150} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonSupplierContacts: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="p-6">
        {/* Title and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Skeleton height={24} width={150} />
          <Skeleton height={40} width={350} />
        </div>

        {/* Table */}
        <div className="space-y-4">
          {/* Header - 7 columns */}
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={`header-${i}`} height={40} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="grid grid-cols-7 gap-4">
              {/* Supplier Code */}
              <Skeleton height={48} />
              {/* Supplier Name */}
              <Skeleton height={48} />
              {/* Status - badge shape */}
              <div className="flex items-center">
                <Skeleton height={28} width={80} className="rounded-full" />
              </div>
              {/* Phone */}
              <Skeleton height={48} />
              {/* Fax */}
              <Skeleton height={48} />
              {/* Email - with extra line */}
              <div className="space-y-1">
                <Skeleton height={20} width="90%" />
                <Skeleton height={14} width="40%" />
              </div>
              {/* Actions - button group */}
              <div className="flex items-center gap-2">
                <Skeleton height={28} width={60} className="rounded" />
                <Skeleton height={28} width={60} className="rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <Skeleton height={32} width={200} />
          <Skeleton height={32} width={150} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonArrivalCheck: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="p-6">
        {/* Title and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Skeleton height={24} width={180} />
          <Skeleton height={40} width={300} />
        </div>

        {/* Table */}
        <div className="space-y-4">
          {/* Header - 6 columns */}
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`header-${i}`} height={40} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="grid grid-cols-6 gap-4 items-center">
              {/* No */}
              <Skeleton height={48} />
              {/* Driver Name */}
              <Skeleton height={48} />
              {/* Plat No */}
              <Skeleton height={48} />
              {/* Supplier - with badge */}
              <div className="flex items-center gap-2">
                <Skeleton height={20} width="60%" />
                <Skeleton height={24} width={80} className="rounded-full" />
              </div>
              {/* Status - badge */}
              <div className="flex items-center">
                <Skeleton height={32} width={100} className="rounded-full" />
              </div>
              {/* Action - button */}
              <Skeleton height={40} width={100} className="rounded-lg" />
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <Skeleton height={32} width={200} />
          <Skeleton height={32} width={150} />
        </div>
      </div>
    </div>
  );
};

export const SkeletonCheckSheet: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="p-6">
        {/* Title and Action Button */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton height={24} width={180} />
          <Skeleton height={36} width={140} className="rounded-lg" />
        </div>

        {/* Show entries and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Skeleton height={16} width={50} />
            <Skeleton height={40} width={70} className="rounded-lg" />
            <Skeleton height={16} width={50} />
          </div>
          <Skeleton height={40} width={350} className="rounded-lg" />
        </div>

        {/* Table */}
        <div className="space-y-4">
          {/* Header - 10 columns */}
          <div className="grid grid-cols-10 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={`header-${i}`} height={40} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="grid grid-cols-10 gap-4 items-center">
              {/* No */}
              <Skeleton height={48} />
              {/* Supplier */}
              <Skeleton height={48} />
              {/* DN Number */}
              <Skeleton height={48} />
              {/* Schedule */}
              <Skeleton height={48} />
              {/* Driver Name */}
              <Skeleton height={48} />
              {/* Plat No */}
              <Skeleton height={48} />
              {/* Dock */}
              <Skeleton height={48} />
              {/* Label Port - checkbox */}
              <div className="flex justify-center">
                <Skeleton height={20} width={20} className="rounded" />
              </div>
              {/* COA/MSDS - checkbox */}
              <div className="flex justify-center">
                <Skeleton height={20} width={20} className="rounded" />
              </div>
              {/* Packing Label - checkbox */}
              <div className="flex justify-center">
                <Skeleton height={20} width={20} className="rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <Skeleton height={16} width={200} />
          <div className="flex gap-2">
            <Skeleton height={40} width={40} className="rounded-lg" />
            <Skeleton height={40} width={40} className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonArrivalManage: React.FC = () => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      <div className="p-6">
        {/* Title and Action Button */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton height={24} width={200} />
          <Skeleton height={36} width={170} className="rounded-lg" />
        </div>

        {/* Show entries and Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Skeleton height={16} width={50} />
            <Skeleton height={40} width={70} className="rounded-lg" />
            <Skeleton height={16} width={50} />
          </div>
          <Skeleton height={40} width={350} className="rounded-lg" />
        </div>

        {/* Table */}
        <div className="space-y-4">
          {/* Header - 9 columns */}
          <div className="grid grid-cols-9 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={`header-${i}`} height={40} />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: 10 }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="grid grid-cols-9 gap-4 items-center">
              {/* ID */}
              <Skeleton height={48} />
              {/* Supplier Code */}
              <Skeleton height={48} />
              {/* Supplier Name */}
              <Skeleton height={48} />
              {/* Arrival Time */}
              <Skeleton height={48} />
              {/* Day */}
              <Skeleton height={48} />
              {/* Dock */}
              <Skeleton height={48} />
              {/* Type - badge */}
              <div className="flex items-center">
                <Skeleton height={28} width={90} className="rounded-full" />
              </div>
              {/* Last Modified */}
              <Skeleton height={48} />
              {/* Actions - button group */}
              <div className="flex items-center gap-1.5">
                <Skeleton height={32} width={32} className="rounded-lg" />
                <Skeleton height={32} width={32} className="rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <Skeleton height={16} width={200} />
          <div className="flex gap-2">
            <Skeleton height={40} width={40} className="rounded-lg" />
            <Skeleton height={40} width={40} className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonCheckSheetHistory: React.FC = () => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Date Picker and Download Button */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Skeleton height={16} width={100} />
          <Skeleton height={40} width={250} className="rounded-lg" />
        </div>
        <Skeleton height={40} width={160} className="rounded-lg" />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Show entries and Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Skeleton height={16} width={50} />
              <Skeleton height={40} width={70} className="rounded-lg" />
              <Skeleton height={16} width={50} />
            </div>
            <Skeleton height={40} width={350} className="rounded-lg" />
          </div>

          {/* Table */}
          <div className="space-y-4">
            {/* Header with Select All - 11 columns */}
            <div className="grid grid-cols-11 gap-4 items-center">
              {/* DN Number with checkbox */}
              <div className="flex items-center gap-2">
                <Skeleton height={20} width={20} className="rounded" />
                <Skeleton height={40} width="70%" />
              </div>
              {/* Other headers */}
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={`header-${i}`} height={40} />
              ))}
            </div>

            {/* Rows */}
            {Array.from({ length: 10 }).map((_, rowIdx) => (
              <div key={`row-${rowIdx}`} className="grid grid-cols-11 gap-4 items-center">
                {/* DN Number with checkbox */}
                <div className="flex gap-3 items-start">
                  <div className="mt-1">
                    <Skeleton height={20} width={20} className="rounded" />
                  </div>
                  <Skeleton height={40} width="70%" />
                </div>
                {/* Supplier with BP Code */}
                <div className="space-y-1">
                  <Skeleton height={20} width="90%" />
                  <Skeleton height={14} width="60%" />
                </div>
                {/* Scheduled Time */}
                <Skeleton height={48} />
                {/* Actual Arrival */}
                <Skeleton height={48} />
                {/* DN Qty */}
                <Skeleton height={48} />
                {/* Actual Qty */}
                <Skeleton height={48} />
                {/* Dock */}
                <Skeleton height={48} />
                {/* Label Part - badge */}
                <div className="flex items-center">
                  <Skeleton height={28} width={60} className="rounded-full" />
                </div>
                {/* COA/MSDS - badge */}
                <div className="flex items-center">
                  <Skeleton height={28} width={60} className="rounded-full" />
                </div>
                {/* Packing - badge */}
                <div className="flex items-center">
                  <Skeleton height={28} width={60} className="rounded-full" />
                </div>
                {/* Receiving PIC */}
                <Skeleton height={48} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Skeleton height={16} width={200} />
            <div className="flex gap-2">
              <Skeleton height={40} width={40} className="rounded-lg" />
              <Skeleton height={40} width={40} className="rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonAddArrivalForm: React.FC = () => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Component Card */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="p-6">
          {/* Card Title */}
          <Skeleton height={24} width={150} className="mb-6" />

          {/* Grid 2 kolom untuk field-field utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Kolom Kiri */}
            <div className="space-y-4">
              {/* Supplier Field */}
              <div>
                <Skeleton height={16} width={80} className="mb-2" />
                <Skeleton height={40} width="100%" className="rounded-lg" />
              </div>

              {/* Arrival Time Field */}
              <div>
                <Skeleton height={16} width={60} className="mb-2" />
                <Skeleton height={40} width="100%" className="rounded-lg" />
              </div>

              {/* Departure Time Field */}
              <div>
                <Skeleton height={16} width={80} className="mb-2" />
                <Skeleton height={40} width="100%" className="rounded-lg" />
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-4">
              {/* Type Field */}
              <div>
                <Skeleton height={16} width={50} className="mb-2" />
                <Skeleton height={40} width="100%" className="rounded-lg" />
              </div>

              {/* Day/Schedule Date Field */}
              <div>
                <Skeleton height={16} width={100} className="mb-2" />
                <Skeleton height={40} width="100%" className="rounded-lg" />
              </div>

              {/* Dock Field */}
              <div>
                <Skeleton height={16} width={50} className="mb-2" />
                <Skeleton height={40} width="100%" className="rounded-lg" />
              </div>
            </div>
          </div>

          {/* DN Selection Field (Full Width) */}
          <div className="mt-4">
            <Skeleton height={16} width={250} className="mb-2" />
            <Skeleton height={40} width="100%" className="rounded-lg" />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Skeleton height={40} width={120} className="rounded-lg" />
            <Skeleton height={40} width={120} className="rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};