'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/ToastProvider';

const AppProviders = ({ children }: { children: ReactNode }) => {
  return <ToastProvider>{children}</ToastProvider>;
};

export default AppProviders;