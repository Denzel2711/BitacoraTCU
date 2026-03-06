import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    message: 'API Bitacora TCU - Universidad Tecnica Nacional',
    version: 'next-1.0.0',
    endpoints: {
      estudiantes: '/api/estudiantes',
      actividades: '/api/actividades',
      evidencias: '/api/evidencias'
    }
  });
}
