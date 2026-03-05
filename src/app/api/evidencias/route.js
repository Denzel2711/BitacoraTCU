import EvidenciaModel from '@/lib/models/evidencia.model';
import { created, fail, serverError } from '@/lib/http';
import { saveUploadedFile, validateEvidenceFile } from '@/lib/uploads';

export async function POST(request) {
  try {
    const formData = await request.formData();

    const actividadId = formData.get('actividadId');
    const tipoEvidencia = formData.get('tipoEvidencia');
    const contenidoTexto = formData.get('contenidoTexto');
    const archivo = formData.get('archivo');

    if (!actividadId || !tipoEvidencia) {
      return fail('actividadId y tipoEvidencia son requeridos', 400);
    }

    let evidencia;

    if (tipoEvidencia === 'Texto') {
      if (!contenidoTexto) {
        return fail('El contenido de texto es requerido', 400);
      }

      evidencia = await EvidenciaModel.createTexto(actividadId, contenidoTexto);
    } else {
      validateEvidenceFile(tipoEvidencia, archivo);

      if (!archivo || typeof archivo.arrayBuffer !== 'function') {
        return fail('Archivo requerido para evidencias de tipo Foto o Documentos', 400);
      }

      const savedFile = await saveUploadedFile(archivo);
      evidencia = await EvidenciaModel.createArchivo(actividadId, tipoEvidencia, savedFile);
    }

    return created(evidencia, 'Evidencia creada exitosamente');
  } catch (error) {
    return serverError(error);
  }
}
