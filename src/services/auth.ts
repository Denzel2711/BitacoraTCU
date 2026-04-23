import 'client-only';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface AuthUser {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string;
  email: string;
  roles: Array<'Admin' | 'Academico' | 'Estudiante'>;
  estudianteId: number | null;
  requiereCambioPassword: boolean;
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
}

export interface AuthCreatedUser {
  user: AuthUser & { id: number };
}

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  message?: string;
  data: T;
}

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
    return null;
  },

  async login(identifier: string, password: string): Promise<AuthSession> {
    const session = await postJson<AuthSession>('/auth/login', { identifier, password });
    return session;
  },

  async register(input: {
    nombreUsuario: string;
    email: string;
    nombreCompleto: string;
    password: string;
    roles?: Array<'Admin' | 'Academico' | 'Estudiante'>;
  }): Promise<AuthCreatedUser> {
    return postJson<AuthCreatedUser>('/auth/usuarios', input);
  },

  async refresh(): Promise<AuthSession> {
    const session = await postJson<AuthSession>('/auth/refresh');
    return session;
  },

  async logout(): Promise<void> {
    await postJson<null>('/auth/logout');
  },

  async changePassword(accessToken: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/password/change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    await parseResponse<null>(response);
  },

  setSession(session: AuthSession): void {
    void session;
  },

  clearStoredSession(): void {
    return;
  },
};
