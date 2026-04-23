'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ToastContextValue, ToastInput, ToastItem, ToastType } from '@/hooks/useToast';

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

const toastStyles: Record<ToastType, string> = {
	success: 'border-emerald-200 bg-emerald-50 text-emerald-900 shadow-emerald-100',
	error: 'border-rose-200 bg-rose-50 text-rose-900 shadow-rose-100',
	info: 'border-sky-200 bg-sky-50 text-sky-900 shadow-sky-100',
};

const toastAccent: Record<ToastType, string> = {
	success: 'bg-emerald-500',
	error: 'bg-rose-500',
	info: 'bg-sky-500',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const dismissToast = useCallback((id: string) => {
		setToasts((current) => current.filter((toast) => toast.id !== id));
	}, []);

	const showToast = useCallback((toast: ToastInput) => {
		const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
		const nextToast: ToastItem = {
			id,
			title: toast.title,
			description: toast.description || '',
			type: toast.type || 'info',
			duration: toast.duration || DEFAULT_DURATION,
		};

		setToasts((current) => [...current, nextToast]);

		window.setTimeout(() => {
			dismissToast(id);
		}, nextToast.duration);
	}, [dismissToast]);

	const success = useCallback((title: string, description?: string) => {
		showToast({ title, description, type: 'success' });
	}, [showToast]);

	const error = useCallback((title: string, description?: string) => {
		showToast({ title, description, type: 'error' });
	}, [showToast]);

	const info = useCallback((title: string, description?: string) => {
		showToast({ title, description, type: 'info' });
	}, [showToast]);

	const value = useMemo<ToastContextValue>(() => ({
		toasts,
		showToast,
		dismissToast,
		success,
		error,
		info,
	}), [toasts, showToast, dismissToast, success, error, info]);

	return (
		<ToastContext.Provider value={value}>
			{children}

			<div className="fixed top-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0 pointer-events-none">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm transition-all ${toastStyles[toast.type]}`}
						role="status"
						aria-live="polite"
					>
						<div className="flex gap-3">
							<div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${toastAccent[toast.type]}`} />
							<div className="min-w-0 flex-1">
								<div className="flex items-start justify-between gap-3">
									<p className="text-sm font-semibold leading-5">{toast.title}</p>
									<button
										type="button"
										onClick={() => dismissToast(toast.id)}
										className="text-xs font-semibold uppercase tracking-wide opacity-60 transition hover:opacity-100"
										aria-label="Cerrar notificación"
									>
										Cerrar
									</button>
								</div>
								{toast.description ? (
									<p className="mt-1 text-sm leading-5 opacity-90 whitespace-pre-line">{toast.description}</p>
								) : null}
							</div>
						</div>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
};

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast debe usarse dentro de ToastProvider');
	}

	return context;
};
