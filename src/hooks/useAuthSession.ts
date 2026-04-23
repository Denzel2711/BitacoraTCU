'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { authService, type AuthSession } from '@/services/auth';

interface RegisterInput {
  nombreUsuario: string;
  nombreCompleto: string;
  email: string;
  password: string;
  roles?: Array<'Admin' | 'Academico' | 'Estudiante'>;
}

interface UseAuthSessionResult {
  session: AuthSession | null;
  loading: boolean;
  error: string;
  clearError: () => void;
  login: (identifier: string, password: string) => Promise<AuthSession | null>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isAuthenticated: boolean;
}

export const useAuthSession = (): UseAuthSessionResult => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const refresh = useCallback(async (): Promise<AuthSession | null> => {
    try {
      const nextSession = await authService.refresh();
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (refreshError) {
      authService.clearStoredSession();
      setSession(null);
      setError((refreshError as Error)?.message || 'Sesion expirada');
      return null;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await refresh();
      setLoading(false);
    };

    void initialize();
  }, [refresh]);

  const login = useCallback(async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const nextSession = await authService.login(identifier, password);
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (loginError) {
      const message = (loginError as Error)?.message || 'No fue posible iniciar sesion';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput): Promise<void> => {
    setLoading(true);
    try {
      await authService.register(input);
      setError('');
    } catch (registerError) {
      const message = (registerError as Error)?.message || 'No fue posible registrar el usuario';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setSession(null);
      setError('');
    } catch (logoutError) {
      const message = (logoutError as Error)?.message || 'No fue posible cerrar sesion';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!session?.accessToken) {
      setError('Se requiere una sesion activa para cambiar la contraseña');
      return false;
    }

    setLoading(true);
    try {
      await authService.changePassword(session.accessToken, currentPassword, newPassword);
      const nextSession = await authService.refresh();
      setSession(nextSession);
      setError('');
      return true;
    } catch (changePasswordError) {
      const message = (changePasswordError as Error)?.message || 'No fue posible actualizar la contraseña';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session]);

  return useMemo(
    () => ({
      session,
      loading,
      error,
      clearError,
      login,
      register,
      logout,
      refresh,
      changePassword,
      isAuthenticated: Boolean(session?.accessToken),
    }),
    [session, loading, error, clearError, login, register, logout, refresh, changePassword]
  );
};
