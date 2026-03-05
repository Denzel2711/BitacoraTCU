import ActividadModel from '@/lib/models/actividad.model';
import EvidenciaModel from '@/lib/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const actividad = await ActividadModel.findById(id);

    if (!actividad) {
      return fail('Actividad no encontrada', 404);
    }

    const evidencias = await EvidenciaModel.findByActividad(id);

    return ok({
      ...actividad,
      evidencias
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const actividad = await ActividadModel.update(id, body);

    if (!actividad) {
      return fail('Actividad no encontrada', 404);
    }

    return ok(actividad, { message: 'Actividad actualizada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    await ActividadModel.delete(id);
    return ok(null, { message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
