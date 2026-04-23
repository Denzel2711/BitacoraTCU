'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SectionHeader from '@/components/layout/SectionHeader';
import { useAuthSession, useToast } from '@/hooks';

const AuthView = () => {
  const router = useRouter();
  const { session, loading, error, clearError, login, changePassword, isAuthenticated } = useAuthSession();
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const requiresPasswordChange = Boolean(session?.user?.requiereCambioPassword);

  useEffect(() => {
    if (isAuthenticated && session) {
      if (session.user.requiereCambioPassword) {
        return;
      }

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

  useEffect(() => {
    if (requiresPasswordChange) {
      toastInfo('Debes actualizar tu contraseña temporal para continuar.');
    }
  }, [requiresPasswordChange, toastInfo]);

  useEffect(() => {
    if (loginAttempted && error) {
      toastError('No fue posible iniciar sesión. Verifique sus credenciales e intente nuevamente.');
    }
  }, [loginAttempted, error, toastError]);

  const handleLogin = async () => {
    setLoginAttempted(true);
    clearError();
    const authSession = await login(identifier, password);
    if (authSession) {
      if (authSession.user.requiereCambioPassword) {
        setCurrentPassword(password);
        setPassword('');
        setLoginAttempted(false);
        return;
      }

      setLoginAttempted(false);
      router.replace('/');
    }
  };

  const handleChangePassword = async () => {
    clearError();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toastError('Completa todos los campos para actualizar la contraseña.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setChangingPassword(true);
    const changed = await changePassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (!changed) {
      toastError('No fue posible actualizar la contraseña. Verifica los datos e intenta nuevamente.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toastSuccess('Contraseña actualizada correctamente.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-cyan-200">
        <SectionHeader
          title="Inicio de Sesión"
          subtitle="Ingresa con tu cuenta para acceder al sistema."
          tone="cyan"
        />

        <div className="p-10">
          <div className="rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-orange-50 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-cyan-900">
                {requiresPasswordChange ? 'Actualiza tu contraseña' : 'Acceso a la Plataforma'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {requiresPasswordChange
                  ? 'Por seguridad, debes cambiar la contraseña temporal para continuar.'
                  : 'Ingresa tus credenciales para continuar.'}
              </p>
            </div>

            {!requiresPasswordChange ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Contraseña temporal actual"
                  required
                  className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  required
                  className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar nueva contraseña"
                  required
                  className="px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={loading || changingPassword}
                  className="md:col-span-3 px-4 py-3 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 disabled:opacity-60"
                >
                  {loading || changingPassword ? 'Actualizando...' : 'Guardar nueva contraseña'}
                </button>
                <p className="md:col-span-3 text-xs text-slate-600">
                  La contraseña debe incluir mayúscula, minúscula, número, símbolo y tener al menos 12 caracteres.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
