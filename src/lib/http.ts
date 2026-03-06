import 'server-only';
import { NextResponse } from 'next/server';

export const ok = (data: unknown, extra: Record<string, unknown> = {}): NextResponse =>
  NextResponse.json({ success: true, data, ...extra });

export const created = (data: unknown, message?: string): NextResponse =>
  NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status: 201 }
  );

export const fail = (error: string, status = 400): NextResponse =>
  NextResponse.json({ success: false, error }, { status });

export const serverError = (error: unknown): NextResponse => {
  console.error(error);
  return NextResponse.json(
    {
      success: false,
      error: (error as Error)?.message || 'Error interno del servidor',
    },
    { status: 500 }
  );
};
