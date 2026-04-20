import ActividadModel from '@/lib/db/models/actividad.model';
import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actividad = await ActividadModel.findById(Number(id));

    if (!actividad) {
      return fail('Actividad no encontrada', 404);
    }

    const evidencias = await EvidenciaModel.findByActividad(Number(id));

    return ok({ ...actividad, evidencias });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const body = await request.json();
    const before = await ActividadModel.findById(Number(id));
    const actividad = await ActividadModel.update(Number(id), body);

    if (!actividad) {
      return fail('Actividad no encontrada', 404);
    }

    await registerAuditEvent({
      tabla: 'actividades',
      accion: 'UPDATE',
      registroId: actividad.id,
      descripcion: 'Actualizacion de actividad',
      before,
      after: actividad,
      request,
    });

    return ok(actividad, { message: 'Actividad actualizada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const csrfError = assertSameOrigin(_request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const before = await ActividadModel.findById(Number(id));
    await ActividadModel.delete(Number(id));

    await registerAuditEvent({
      tabla: 'actividades',
      accion: 'DELETE',
      registroId: id,
      descripcion: 'Eliminacion de actividad',
      before,
      request: _request,
    });

    return ok(null, { message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
