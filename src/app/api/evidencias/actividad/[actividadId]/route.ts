import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { ok, serverError } from '@/lib/http';
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ actividadId: string }> }) {
  try {
    const { actividadId } = await params;
    const evidencias = await EvidenciaModel.findByActividad(Number(actividadId));

    return ok(evidencias, { total: evidencias.length });
  } catch (error) {
    return serverError(error);
  }
}
