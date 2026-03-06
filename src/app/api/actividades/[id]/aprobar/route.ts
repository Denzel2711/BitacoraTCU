import ActividadModel from '@/lib/db/models/actividad.model';
import { ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actividad = await ActividadModel.aprobar(Number(id), body?.observaciones || '');

    return ok(actividad, { message: 'Actividad aprobada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
