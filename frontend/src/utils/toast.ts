// src/utils/toast.ts
import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string): string => {
    return toast.success(message, { duration: 4000 });
  },

  error: (message: string): string => {
    return toast.error(message, { duration: 4000 });
  },

  info: (message: string): string => {
    return toast(message, { duration: 4000 });
  },

  warning: (message: string): string => {
    return toast(message, { duration: 4000, icon: '⚠️' });
  },

  loading: (message: string): string => {
    return toast.loading(message);
  },

  promise: <T>(promise: Promise<T>, messages: { loading: string; success: string; error: string }): Promise<T> => {
    return toast.promise(promise, messages);
  },

  update: (toastId: string, message: string, type: 'success' | 'error' | 'loading' = 'success') => {
    toast.dismiss(toastId);
    if (type === 'success') return toast.success(message);
    if (type === 'error') return toast.error(message);
    if (type === 'loading') return toast.loading(message);
    return toast(message);
  },

  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId);
  },
};
