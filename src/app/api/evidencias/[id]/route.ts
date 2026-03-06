import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';
import { deleteUploadedFileByUrl } from '@/lib/uploads';
import type { NextRequest } from 'next/server';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const evidencia = await EvidenciaModel.findById(Number(id));

    if (!evidencia) {
      return fail('Evidencia no encontrada', 404);
    }

    if (evidencia.ruta_archivo) {
      await deleteUploadedFileByUrl(evidencia.ruta_archivo);
    }

    await EvidenciaModel.delete(Number(id));

    return ok(null, { message: 'Evidencia eliminada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
