'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TCUFormView from '@/components/features/TCUFormView';
import { useAuthSession } from '@/hooks';

const ProtectedFormPage = () => {
  const router = useRouter();
  const { session, loading, isAuthenticated, logout } = useAuthSession();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }

    const roles = session?.user.roles || [];
    const isStudent = roles.includes('Estudiante') && Boolean(session?.user.estudianteId);
    const requiresPasswordChange = Boolean(session?.user.requiereCambioPassword);

    if (!loading && isAuthenticated && requiresPasswordChange) {
      router.replace('/auth');
      return;
    }

    if (!loading && !isStudent) {
      router.replace('/admin');
    }
  }, [loading, isAuthenticated, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center">
        <p className="text-slate-700 font-medium">Validando sesión...</p>
      </div>
    );
  }

  if (!session?.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center px-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-3">
          <h1 className="text-xl font-bold text-slate-900">Se requiere autenticación</h1>
          <p className="text-slate-600 text-sm">
            Para acceder al formulario principal debes iniciar sesión en el sistema.
          </p>
          <Link
            href="/auth"
            className="inline-block px-4 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700"
          >
            Ir a Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TCUFormView
      accessToken={session.accessToken}
      estudianteSesionId={session.user.estudianteId}
      sessionUser={session.user}
      onLogout={() => void logout()}
    />
  );
};

export default ProtectedFormPage;
