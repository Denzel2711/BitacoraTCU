import ActividadModel from '@/lib/db/models/actividad.model';
import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { created, fail, ok, serverError } from '@/lib/http';
import { requireAuthRole } from '@/lib/auth/authorization';
import { registerAuditEvent } from '@/lib/services/audit.service';
import { assertSameOrigin } from '@/lib/security/request-context';
import { saveUploadedFile, validateEvidenceFile } from '@/lib/uploads';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin']);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);

    const filters = {
      estudianteId: searchParams.get('estudiante_id') ?? undefined,
      cedula: searchParams.get('cedula') ?? undefined,
      estado: searchParams.get('estado') ?? undefined,
      fechaInicio: searchParams.get('fecha_inicio') ?? undefined,
      fechaFin: searchParams.get('fecha_fin') ?? undefined,
      limit: searchParams.get('limit') ?? undefined
    };

    const actividades = await ActividadModel.findAll(filters);
    return ok(actividades, { total: actividades.length, filters });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Estudiante']);
    if (authError) {
      return authError;
    }

    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const formData = await request.formData();

    const estudianteId = formData.get('estudianteId') as string | null;
    const fechaActividad = formData.get('fechaActividad') as string | null;
    const tipoActividad = formData.get('tipoActividad') as string | null;
    const subtipoActividad = formData.get('subtipoActividad') as string | null;
    const tipoCapacitacion = formData.get('tipoCapacitacion') as string | null;
    const experienciasAprendizajes = formData.get('experienciasAprendizajes') as string | null;
    const descripcionActividad = formData.get('descripcionActividad') as string | null;
    const horaInicio = formData.get('horaInicio') as string | null;
    const horaFinal = formData.get('horaFinal') as string | null;
    const ubicacionLat = formData.get('ubicacionLat') as string | null;
    const ubicacionLng = formData.get('ubicacionLng') as string | null;
    const descripcionUbicacion = formData.get('descripcionUbicacion') as string | null;
    const tipoEvidencia = formData.get('tipoEvidencia') as string | null;
    const evidenciaTexto = formData.get('evidenciaTexto') as string | null;
    const archivo = formData.get('archivo');

    if (!estudianteId || !fechaActividad || !tipoActividad || !descripcionActividad) {
      return fail('Faltan campos requeridos', 400);
    }

    validateEvidenceFile(tipoEvidencia as 'Foto' | 'Documentos' | 'Texto' | 'No incluye', archivo as File | null);

    const actividad = await ActividadModel.create({
      estudianteId: Number(estudianteId),
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

    if (!actividad) {
      return fail('No fue posible registrar la actividad', 500);
    }

    let evidencia = null;

    if (tipoEvidencia === 'Texto' && evidenciaTexto) {
      evidencia = await EvidenciaModel.createTexto(Number(actividad.id), evidenciaTexto);
    } else if (tipoEvidencia && tipoEvidencia !== 'No incluye' && archivo && typeof (archivo as Blob).arrayBuffer === 'function') {
      const savedFile = await saveUploadedFile(archivo as File);
      evidencia = await EvidenciaModel.createArchivo(Number(actividad.id), tipoEvidencia, savedFile);
    }

    await registerAuditEvent({
      tabla: 'actividades',
      accion: 'CREATE',
      registroId: actividad.id,
      descripcion: 'Registro de actividad y evidencia',
      after: { actividad, evidencia },
      request,
    });

    return created({ ...actividad, evidencia }, 'Actividad registrada exitosamente');
  } catch (error) {
    return serverError(error);
  }
}
