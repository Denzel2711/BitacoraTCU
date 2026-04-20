import 'client-only';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const SESSION_STORAGE_KEY = 'bitacora_tcu_session';

export interface AuthUser {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  email: string;
  roles: Array<'Admin' | 'Academico' | 'Estudiante'>;
  estudianteId: number | null;
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
}

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  data: T;
}

const saveSession = (session: AuthSession): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const clearSession = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || payload?.message || 'Error de autenticacion');
  }

  return payload.data;
};

const postJson = async <T>(path: string, body?: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
};

export const authService = {
  getStoredSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.accessToken || !parsed?.user) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  async login(identifier: string, password: string): Promise<AuthSession> {
    const session = await postJson<AuthSession>('/auth/login', { identifier, password });
    saveSession(session);
    return session;
  },

  async register(input: {
    nombreUsuario: string;
    email: string;
    nombreCompleto: string;
    password: string;
    roles?: Array<'Admin' | 'Academico' | 'Estudiante'>;
  }): Promise<AuthSession> {
    const session = await postJson<AuthSession>('/auth/usuarios', input);
    saveSession(session);
    return session;
  },

  async refresh(): Promise<AuthSession> {
    const session = await postJson<AuthSession>('/auth/refresh');
    saveSession(session);
    return session;
  },

  async logout(): Promise<void> {
    try {
      await postJson<null>('/auth/logout');
    } finally {
      clearSession();
    }
  },

  setSession(session: AuthSession): void {
    saveSession(session);
  },

  clearStoredSession(): void {
    clearSession();
  },
};
