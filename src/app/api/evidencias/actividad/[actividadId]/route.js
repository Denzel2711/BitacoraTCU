import EvidenciaModel from '@/lib/models/evidencia.model';
import { ok, serverError } from '@/lib/http';

export async function GET(_request, { params }) {
  try {
    const { actividadId } = await params;
    const evidencias = await EvidenciaModel.findByActividad(actividadId);

    return ok(evidencias, { total: evidencias.length });
  } catch (error) {
    return serverError(error);
  }
}
