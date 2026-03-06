import ActividadModel from '@/lib/db/models/actividad.model';
import { ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estudianteId = searchParams.get('estudianteId');
    const estadisticas = await ActividadModel.getEstadisticas(estudianteId ? Number(estudianteId) : null);
    return ok(estadisticas);
  } catch (error) {
    return serverError(error);
  }
}
