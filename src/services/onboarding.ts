import 'client-only';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface OnboardingPayload {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  carrera: string;
  academicoACargo: string;
  sede: string;
  nombreUsuario: string;
  email: string;
  password: string;
  periodo: string;
  fechaInicio: string;
  reinicioDesdeCero?: boolean;
}

export const onboardingService = {
  async registerStudent(payload: OnboardingPayload, accessToken: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/estudiantes/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result?.success) {
      throw new Error(result?.error || result?.message || 'No se pudo registrar el estudiante');
    }

    return result.data;
  },
};
