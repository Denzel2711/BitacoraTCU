import ActividadModel from '@/lib/models/actividad.model';
import { ok, serverError } from '@/lib/http';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const estudianteId = searchParams.get('estudianteId');
    const estadisticas = await ActividadModel.getEstadisticas(estudianteId || null);
    return ok(estadisticas);
  } catch (error) {
    return serverError(error);
  }
}
