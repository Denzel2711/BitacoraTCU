'use client';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastItem extends Required<Pick<ToastInput, 'title'>> {
  id: string;
  description: string;
  type: ToastType;
  duration: number;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: ToastInput) => void;
  dismissToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

export { useToast } from '@/components/ui/ToastProvider';
