import { toast } from 'react-toastify';
import { CustomToast } from '../components/ui/CustomToast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  autoClose?: number | false;
  actionLabel?: string;
  onAction?: () => void;
}

const defaultOptions = {
  position: 'top-right' as const,
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  closeButton: false,
  className: '!bg-white dark:!bg-gray-800 !shadow-lg !rounded-lg !border-0 relative overflow-hidden !p-0',
} as any;

export const useToast = () => {
  return {
    success: (message: string, options?: ToastOptions): void => {
      const { title, actionLabel, onAction, ...toastOptions } = options || {};
      toast(CustomToast, {
        ...defaultOptions,
        ...toastOptions,
        data: {
          type: 'success',
          message,
          title,
          actionLabel,
          onAction,
        },
      });
    },
    error: (message: string, options?: ToastOptions): void => {
      const { title, actionLabel, onAction, ...toastOptions } = options || {};
      toast(CustomToast, {
        ...defaultOptions,
        ...toastOptions,
        data: {
          type: 'error',
          message,
          title,
          actionLabel,
          onAction,
        },
      });
    },
    info: (message: string, options?: ToastOptions): void => {
      const { title, actionLabel, onAction, ...toastOptions } = options || {};
      toast(CustomToast, {
        ...defaultOptions,
        ...toastOptions,
        data: {
          type: 'info',
          message,
          title,
          actionLabel,
          onAction,
        },
      });
    },
    warning: (message: string, options?: ToastOptions): void => {
      const { title, actionLabel, onAction, ...toastOptions } = options || {};
      toast(CustomToast, {
        ...defaultOptions,
        ...toastOptions,
        data: {
          type: 'warning',
          message,
          title,
          actionLabel,
          onAction,
        },
      });
    },
  };
};