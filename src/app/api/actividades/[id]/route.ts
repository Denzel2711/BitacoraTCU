import ActividadModel from '@/lib/db/models/actividad.model';
import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';
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
    const body = await request.json();
    const actividad = await ActividadModel.update(Number(id), body);

    if (!actividad) {
      return fail('Actividad no encontrada', 404);
    }

    return ok(actividad, { message: 'Actividad actualizada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ActividadModel.delete(Number(id));
    return ok(null, { message: 'Actividad eliminada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
