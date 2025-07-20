'use client';

import { ToastManager, useToastStore } from './Toast';

export const ToastProvider = () => {
  const { toasts, removeToast } = useToastStore();

  return <ToastManager toasts={toasts} removeToast={removeToast} />;
}; 