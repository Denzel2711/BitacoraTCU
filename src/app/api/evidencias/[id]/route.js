import EvidenciaModel from '@/lib/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';
import { deleteUploadedFileByUrl } from '@/lib/uploads';

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const evidencia = await EvidenciaModel.findById(id);

    if (!evidencia) {
      return fail('Evidencia no encontrada', 404);
    }

    if (evidencia.ruta_archivo) {
      await deleteUploadedFileByUrl(evidencia.ruta_archivo);
    }

    await EvidenciaModel.delete(id);

    return ok(null, { message: 'Evidencia eliminada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
