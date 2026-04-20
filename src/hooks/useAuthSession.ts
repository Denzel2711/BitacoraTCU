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
  register: (input: RegisterInput) => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
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
      const storedSession = authService.getStoredSession();
      if (storedSession) {
        setSession(storedSession);
      }

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
      setError((loginError as Error)?.message || 'No fue posible iniciar sesion');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setLoading(true);
    try {
      const nextSession = await authService.register(input);
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (registerError) {
      setError((registerError as Error)?.message || 'No fue posible registrar el usuario');
      return null;
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
      setError((logoutError as Error)?.message || 'No fue posible cerrar sesion');
    } finally {
      setLoading(false);
    }
  }, []);

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
      isAuthenticated: Boolean(session?.accessToken),
    }),
    [session, loading, error, clearError, login, register, logout, refresh]
  );
};
