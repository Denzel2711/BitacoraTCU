import { NextResponse } from 'next/server';

export const ok = (data, extra = {}) =>
  NextResponse.json({ success: true, data, ...extra });

export const created = (data, message) =>
  NextResponse.json({ success: true, data, ...(message ? { message } : {}) }, { status: 201 });

export const fail = (error, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

export const serverError = (error) => {
  console.error(error);
  return NextResponse.json(
    {
      success: false,
      error: error?.message || 'Error interno del servidor'
    },
    { status: 500 }
  );
};
