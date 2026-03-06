import ActividadModel from '@/lib/db/models/actividad.model';
import { fail, ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body?.observaciones) {
      return fail('Las observaciones son requeridas para rechazar una actividad', 400);
    }

    const actividad = await ActividadModel.rechazar(Number(id), body.observaciones);

    return ok(actividad, { message: 'Actividad rechazada' });
  } catch (error) {
    return serverError(error);
  }
}
