import ActividadModel from '@/lib/models/actividad.model';
import { ok, serverError } from '@/lib/http';

export async function GET(_request, { params }) {
  try {
    const { estudianteId } = await params;
    const actividades = await ActividadModel.findByEstudiante(estudianteId);
    return ok(actividades, { total: actividades.length });
  } catch (error) {
    return serverError(error);
  }
}
