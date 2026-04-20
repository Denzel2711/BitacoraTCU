import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { created, fail, serverError } from '@/lib/http';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import { saveUploadedFile, validateEvidenceFile } from '@/lib/uploads';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const formData = await request.formData();

    const actividadId = formData.get('actividadId') as string | null;
    const tipoEvidencia = formData.get('tipoEvidencia') as string | null;
    const contenidoTexto = formData.get('contenidoTexto') as string | null;
    const archivo = formData.get('archivo');

    if (!actividadId || !tipoEvidencia) {
      return fail('actividadId y tipoEvidencia son requeridos', 400);
    }

    let evidencia;

    if (tipoEvidencia === 'Texto') {
      if (!contenidoTexto) {
        return fail('El contenido de texto es requerido', 400);
      }
      evidencia = await EvidenciaModel.createTexto(Number(actividadId), contenidoTexto);
    } else {
      validateEvidenceFile(tipoEvidencia as 'Foto' | 'Documentos' | 'Texto' | 'No incluye', archivo as File | null);

      if (!archivo || typeof (archivo as Blob).arrayBuffer !== 'function') {
        return fail('Archivo requerido para evidencias de tipo Foto o Documentos', 400);
      }

      const savedFile = await saveUploadedFile(archivo as File);
      evidencia = await EvidenciaModel.createArchivo(Number(actividadId), tipoEvidencia, savedFile);
    }

    await registerAuditEvent({
      tabla: 'evidencias',
      accion: 'CREATE',
      registroId: evidencia?.id ?? null,
      descripcion: 'Creacion de evidencia',
      after: evidencia,
      request,
    });

    return created(evidencia, 'Evidencia creada exitosamente');
  } catch (error) {
    return serverError(error);
  }
}
