import 'client-only';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface AdminUser {
  id: number;
  nombre_usuario: string;
  email: string;
  nombre_completo: string;
  estudiante_id?: number | null;
  rol: 'Admin' | 'Academico' | 'Estudiante';
  roles: Array<'Admin' | 'Academico' | 'Estudiante'>;
  activo: number | boolean;
  ultimo_login: string | null;
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
}

export interface AdminAcademic {
  id: number;
  nombre_usuario: string;
  email: string;
  nombre_completo: string;
}

export interface AdminStudent {
  id: number;
  cedula: string;
  nombre: string;
  primer_apellido: string;
  segundo_apellido?: string;
  carrera: string;
  academico_a_cargo: string;
  sede: string;
}

export interface AdminActivity {
  id: number;
  estudiante_id: number;
  cedula: string;
  nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  fecha_actividad: string;
  tipo_actividad: string;
  subtipo_actividad: string;
  descripcion_actividad: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
  horas_trabajadas: number;
  fecha_registro: string;
  matriculacion_id: number | null;
  periodo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  matriculacion_estado: 'Activa' | 'Completada' | 'Suspendida' | null;
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
    throw new Error(payload?.error || payload?.message || 'Error en la operacion administrativa');
  }

  return payload.data;
};

const fetchJson = async <T>(path: string, accessToken: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  return parseResponse<T>(response);
};

export const adminService = {
  getUsers(accessToken: string): Promise<AdminUser[]> {
    return fetchJson<AdminUser[]>('/auth/usuarios', accessToken, { method: 'GET' });
  },

  createUser(accessToken: string, payload: {
    nombreUsuario: string;
    email: string;
    nombreCompleto: string;
    password: string;
    roles: Array<'Admin' | 'Academico' | 'Estudiante'>;
  }): Promise<unknown> {
    return fetchJson('/auth/usuarios', accessToken, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateUser(accessToken: string, userId: number, payload: {
    nombreUsuario: string;
    email: string;
    nombreCompleto: string;
    roles: Array<'Admin' | 'Academico' | 'Estudiante'>;
    activo: boolean;
  }): Promise<unknown> {
    return fetchJson(`/auth/usuarios/${userId}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getAcademicos(accessToken: string): Promise<AdminAcademic[]> {
    return fetchJson<AdminAcademic[]>('/auth/usuarios/academicos', accessToken, { method: 'GET' });
  },

  getStudents(accessToken: string): Promise<AdminStudent[]> {
    return fetchJson<AdminStudent[]>('/estudiantes', accessToken, { method: 'GET' });
  },

  getActivities(accessToken: string): Promise<AdminActivity[]> {
    return fetchJson<AdminActivity[]>('/actividades?limit=500', accessToken, { method: 'GET' });
  },

  getStudentActivities(accessToken: string, estudianteId: number | string): Promise<AdminActivity[]> {
    return fetchJson<AdminActivity[]>(`/actividades/estudiante/${encodeURIComponent(String(estudianteId))}`, accessToken, { method: 'GET' });
  },

  getActivityEvidence(accessToken: string, actividadId: number | string): Promise<unknown[]> {
    return fetchJson<unknown[]>(`/evidencias/actividad/${encodeURIComponent(String(actividadId))}`, accessToken, { method: 'GET' });
  },

  updateStudent(accessToken: string, studentId: number | string, payload: {
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
    carrera: string;
    academicoACargo: string;
    sede: string;
  }): Promise<unknown> {
    return fetchJson(`/estudiantes/${encodeURIComponent(String(studentId))}`, accessToken, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};