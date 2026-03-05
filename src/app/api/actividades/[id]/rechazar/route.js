import ActividadModel from '@/lib/models/actividad.model';
import { fail, ok, serverError } from '@/lib/http';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.observaciones) {
      return fail('Las observaciones son requeridas para rechazar una actividad', 400);
    }

    const actividad = await ActividadModel.rechazar(id, body.observaciones);

    return ok(actividad, { message: 'Actividad rechazada' });
  } catch (error) {
    return serverError(error);
  }
}
