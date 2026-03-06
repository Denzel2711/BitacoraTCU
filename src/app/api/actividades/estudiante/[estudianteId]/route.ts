import ActividadModel from '@/lib/db/models/actividad.model';
import { ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ estudianteId: string }> }) {
  try {
    const { estudianteId } = await params;
    const actividades = await ActividadModel.findByEstudiante(Number(estudianteId));
    return ok(actividades, { total: actividades.length });
  } catch (error) {
    return serverError(error);
  }
}
