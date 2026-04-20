import ActividadModel from '@/lib/db/models/actividad.model';
import { fail, ok, serverError } from '@/lib/http';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import type { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const body = await request.json();

    if (!body?.observaciones) {
      return fail('Las observaciones son requeridas para rechazar una actividad', 400);
    }

    const before = await ActividadModel.findById(Number(id));
    const actividad = await ActividadModel.rechazar(Number(id), body.observaciones);

    await registerAuditEvent({
      tabla: 'actividades',
      accion: 'REJECT',
      registroId: id,
      descripcion: 'Rechazo de actividad',
      before,
      after: actividad,
      request,
    });

    return ok(actividad, { message: 'Actividad rechazada' });
  } catch (error) {
    return serverError(error);
  }
}
