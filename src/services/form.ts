import type { Estudiante, FormData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const buscarEstudiante = async (cedula: string): Promise<Estudiante> => {
  const response = await fetch(`${API_BASE_URL}/estudiantes/cedula/${cedula}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al buscar estudiante');
  return data.data;
};

const searchEstudiantes = async (query: string): Promise<Estudiante[]> => {
  const response = await fetch(`${API_BASE_URL}/estudiantes/search?q=${encodeURIComponent(query)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al buscar estudiantes');
  return data.data;
};

const getEstudiantes = async (): Promise<Estudiante[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al obtener estudiantes');
    return data.data;
  } catch {
    return [];
  }
};

const submitForm = async (formData: FormData): Promise<unknown> => {
  const estudiante = await buscarEstudiante(formData.cedula);
  if (!estudiante) throw new Error('Estudiante no encontrado. Verifique el número de cédula.');

  const actividadData = new globalThis.FormData();
  actividadData.append('estudianteId',         String((estudiante as Estudiante & { id: number }).id));
  actividadData.append('fechaActividad',        formData.fechaActividad);
  actividadData.append('tipoActividad',         formData.tipoActividad);
  actividadData.append('subtipoActividad',      formData.subtipoActividad);
  actividadData.append('descripcionActividad',  formData.descripcionActividad);
  actividadData.append('horaInicio',            formData.horaInicio);
  actividadData.append('horaFinal',             formData.horaFinal);

  if (formData.tipoCapacitacion)       actividadData.append('tipoCapacitacion',       formData.tipoCapacitacion);
  if (formData.experienciasAprendizajes) actividadData.append('experienciasAprendizajes', formData.experienciasAprendizajes);
  if (formData.ubicacionLat && formData.ubicacionLng) {
    actividadData.append('ubicacionLat', String(formData.ubicacionLat));
    actividadData.append('ubicacionLng', String(formData.ubicacionLng));
  }
  if (formData.descripcionUbicacion)   actividadData.append('descripcionUbicacion', formData.descripcionUbicacion);

  actividadData.append('tipoEvidencia', formData.tipoEvidencia);
  if (formData.tipoEvidencia === 'Texto' && formData.evidenciaTexto)
    actividadData.append('evidenciaTexto', formData.evidenciaTexto);
  else if (formData.tipoEvidencia === 'Foto' && formData.evidenciaFoto)
    actividadData.append('archivo', formData.evidenciaFoto);
  else if (formData.tipoEvidencia === 'Documentos' && formData.evidenciaDocumento)
    actividadData.append('archivo', formData.evidenciaDocumento);

  const response = await fetch(`${API_BASE_URL}/actividades`, { method: 'POST', body: actividadData });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al enviar el formulario');
  return data;
};

const obtenerActividadesEstudiante = async (estudianteId: number): Promise<unknown[]> => {
  const response = await fetch(`${API_BASE_URL}/actividades/estudiante/${estudianteId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener actividades');
  return data.data;
};

const obtenerResumenEstudiante = async (estudianteId: number): Promise<unknown> => {
  const response = await fetch(`${API_BASE_URL}/estudiantes/${estudianteId}/resumen`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al obtener resumen');
  return data.data;
};

export const formService = {
  submitForm,
  buscarEstudiante,
  searchEstudiantes,
  getEstudiantes,
  obtenerActividadesEstudiante,
  obtenerResumenEstudiante,
};
