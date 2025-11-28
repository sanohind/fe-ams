import { ToastContentProps } from 'react-toastify';

type CustomToastProps = ToastContentProps<{
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  actionLabel?: string;
  onAction?: () => void;
}>;

/**
 * Custom Toast Component
 * Displays toast with colored border at the bottom
 * Background adapts to light/dark mode
 */
export function CustomToast({
  closeToast,
  data,
  toastProps,
}: CustomToastProps) {
  if (!data) return null;

  const { title, message, type, actionLabel, onAction } = data;

  // Progress bar colors based on type
  const progressColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  // Icon colors
  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
  };

  // Icons
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  };

  const handleAction = () => {
    if (onAction) onAction();
    closeToast();
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 mt-0.5 ${iconColors[type]}`}>
          {icons[type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={closeToast}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Action Button */}
      {actionLabel && onAction && (
        <div className="px-4 pb-3 flex justify-end">
          <button
            onClick={handleAction}
            className="text-xs font-semibold px-3 py-1.5 rounded-md transition-all active:scale-95 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
          >
            {actionLabel}
          </button>
        </div>
      )}

      {/* Animated Progress Bar at Bottom */}
      {toastProps.autoClose !== false && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div 
            className={`h-full ${progressColors[type]}`}
            style={{
              animation: `shrink ${toastProps.autoClose || 3000}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
