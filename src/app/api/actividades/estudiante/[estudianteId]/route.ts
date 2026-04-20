import ActividadModel from '@/lib/db/models/actividad.model';
import { ok, serverError } from '@/lib/http';
import { requireAuthRole } from '@/lib/auth/authorization';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ estudianteId: string }> }) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Academico', 'Estudiante']);
    if (authError) {
      return authError;
    }

    const { estudianteId } = await params;
    const actividades = await ActividadModel.findByEstudiante(estudianteId);
    return ok(actividades, { total: actividades.length });
  } catch (error) {
    return serverError(error);
  }
}
