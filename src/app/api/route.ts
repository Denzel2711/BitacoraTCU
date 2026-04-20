import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    message: 'API Bitacora TCU - Universidad Tecnica Nacional',
    version: 'next-1.0.0',
    endpoints: {
      auth: '/api/auth/login',
      authRefresh: '/api/auth/refresh',
      authLogout: '/api/auth/logout',
      authRegistro: '/api/auth/usuarios',
      estudiantes: '/api/estudiantes',
      estudiantesOnboarding: '/api/estudiantes/onboarding',
      actividades: '/api/actividades',
      auditoria: '/api/auditoria',
      evidencias: '/api/evidencias',
      reportes: '/api/reportes/bitacora-pdf/:estudiante_id'
    }
  });
}
