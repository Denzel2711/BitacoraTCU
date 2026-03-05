import ActividadModel from '@/lib/models/actividad.model';
import { ok, serverError } from '@/lib/http';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actividad = await ActividadModel.aprobar(id, body?.observaciones || '');

    return ok(actividad, { message: 'Actividad aprobada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
