import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import { deleteUploadedFileByUrl } from '@/lib/uploads';
import type { NextRequest } from 'next/server';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const csrfError = assertSameOrigin(_request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const evidencia = await EvidenciaModel.findById(Number(id));

    if (!evidencia) {
      return fail('Evidencia no encontrada', 404);
    }

    if (evidencia.ruta_archivo) {
      await deleteUploadedFileByUrl(evidencia.ruta_archivo);
    }

    await EvidenciaModel.delete(Number(id));

    await registerAuditEvent({
      tabla: 'evidencias',
      accion: 'DELETE',
      registroId: id,
      descripcion: 'Eliminacion de evidencia',
      before: evidencia,
      request: _request,
    });

    return ok(null, { message: 'Evidencia eliminada exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}
