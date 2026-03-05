import ActividadModel from '@/lib/models/actividad.model';
import EvidenciaModel from '@/lib/models/evidencia.model';
import { created, fail, ok, serverError } from '@/lib/http';
import { saveUploadedFile, validateEvidenceFile } from '@/lib/uploads';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      estudianteId: searchParams.get('estudiante_id') || undefined,
      cedula: searchParams.get('cedula') || undefined,
      estado: searchParams.get('estado') || undefined,
      fechaInicio: searchParams.get('fecha_inicio') || undefined,
      fechaFin: searchParams.get('fecha_fin') || undefined,
      limit: searchParams.get('limit') || undefined
    };

    const actividades = await ActividadModel.findAll(filters);
    return ok(actividades, { total: actividades.length, filters });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();

    const estudianteId = formData.get('estudianteId');
    const fechaActividad = formData.get('fechaActividad');
    const tipoActividad = formData.get('tipoActividad');
    const subtipoActividad = formData.get('subtipoActividad');
    const tipoCapacitacion = formData.get('tipoCapacitacion');
    const experienciasAprendizajes = formData.get('experienciasAprendizajes');
    const descripcionActividad = formData.get('descripcionActividad');
    const horaInicio = formData.get('horaInicio');
    const horaFinal = formData.get('horaFinal');
    const ubicacionLat = formData.get('ubicacionLat');
    const ubicacionLng = formData.get('ubicacionLng');
    const descripcionUbicacion = formData.get('descripcionUbicacion');
    const tipoEvidencia = formData.get('tipoEvidencia');
    const evidenciaTexto = formData.get('evidenciaTexto');
    const archivo = formData.get('archivo');

    if (!estudianteId || !fechaActividad || !tipoActividad || !descripcionActividad) {
      return fail('Faltan campos requeridos', 400);
    }

    validateEvidenceFile(tipoEvidencia, archivo);

    const actividad = await ActividadModel.create({
      estudianteId,
      fechaActividad,
      tipoActividad,
      subtipoActividad,
      tipoCapacitacion,
      experienciasAprendizajes,
      descripcionActividad,
      horaInicio,
      horaFinal,
      ubicacionLat: ubicacionLat ? Number(ubicacionLat) : null,
      ubicacionLng: ubicacionLng ? Number(ubicacionLng) : null,
      descripcionUbicacion
    });

    let evidencia = null;

    if (tipoEvidencia === 'Texto' && evidenciaTexto) {
      evidencia = await EvidenciaModel.createTexto(actividad.id, evidenciaTexto);
    } else if (tipoEvidencia && tipoEvidencia !== 'No incluye' && archivo && typeof archivo.arrayBuffer === 'function') {
      const savedFile = await saveUploadedFile(archivo);
      evidencia = await EvidenciaModel.createArchivo(actividad.id, tipoEvidencia, savedFile);
    }

    return created({ ...actividad, evidencia }, 'Actividad registrada exitosamente');
  } catch (error) {
    return serverError(error);
  }
}
