'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FormHeader from '@/components/layout/FormHeader';
import { useAuthSession } from '@/hooks';

const AuthView = () => {
  const router = useRouter();
  const { session, loading, error, clearError, login, isAuthenticated } = useAuthSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated && session) {
      const roles = session.user.roles || [];
      const canAccessAdmin = roles.includes('Admin') || roles.includes('Academico');
      const canAccessForm = roles.includes('Estudiante') && Boolean(session.user.estudianteId);

      if (canAccessAdmin) {
        router.replace('/admin');
        return;
      }

      if (canAccessForm) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, session, router]);

  const handleLogin = async () => {
    clearError();
    const authSession = await login(identifier, password);
    if (authSession) {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <FormHeader />

        <div className="p-10">
          <div className="rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-orange-50 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-cyan-900">Acceso a la Plataforma</h2>
              <p className="text-sm text-slate-600 mt-1">
                Ingresa con tus credenciales para registrar actividades en la bitácora institucional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Usuario o email"
                required
                className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required
                className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:opacity-60"
              >
                {loading ? 'Validando...' : 'Entrar'}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
