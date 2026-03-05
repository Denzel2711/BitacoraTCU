/**
 * Servicio para manejar las peticiones a la API del backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Buscar estudiantes por cédula
 */
const buscarEstudiante = async (cedula) => {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes/cedula/${cedula}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al buscar estudiante');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en buscarEstudiante:', error);
    throw error;
  }
};

/**
 * Buscar estudiantes por query (nombre, apellido, cédula)
 */
const searchEstudiantes = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al buscar estudiantes');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en searchEstudiantes:', error);
    throw error;
  }
};

/**
 * Obtener todos los estudiantes
 */
const obtenerEstudiantes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener estudiantes');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en obtenerEstudiantes:', error);
    throw error;
  }
};

/**
 * Enviar formulario de actividad con evidencia
 */
const submitForm = async (formData) => {
  try {
    // Primero buscar o verificar el estudiante
    let estudiante = await buscarEstudiante(formData.cedula);
    
    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    // Preparar datos para enviar
    const actividadData = new FormData();
    
    // Datos básicos
    actividadData.append('estudianteId', estudiante.id);
    actividadData.append('fechaActividad', formData.fechaActividad);
    actividadData.append('tipoActividad', formData.tipoActividad);
    actividadData.append('subtipoActividad', formData.subtipoActividad);
    actividadData.append('descripcionActividad', formData.descripcionActividad);
    actividadData.append('horaInicio', formData.horaInicio);
    actividadData.append('horaFinal', formData.horaFinal);
    
    // Campos opcionales
    if (formData.tipoCapacitacion) {
      actividadData.append('tipoCapacitacion', formData.tipoCapacitacion);
    }
    
    if (formData.experienciasAprendizajes) {
      actividadData.append('experienciasAprendizajes', formData.experienciasAprendizajes);
    }
    
    // Geolocalización
    if (formData.ubicacionLat && formData.ubicacionLng) {
      actividadData.append('ubicacionLat', formData.ubicacionLat);
      actividadData.append('ubicacionLng', formData.ubicacionLng);
    }
    
    if (formData.descripcionUbicacion) {
      actividadData.append('descripcionUbicacion', formData.descripcionUbicacion);
    }
    
    // Evidencias
    actividadData.append('tipoEvidencia', formData.tipoEvidencia);
    
    if (formData.tipoEvidencia === 'Texto' && formData.evidenciaTexto) {
      actividadData.append('evidenciaTexto', formData.evidenciaTexto);
    } else if (formData.tipoEvidencia === 'Foto' && formData.evidenciaFoto) {
      actividadData.append('archivo', formData.evidenciaFoto);
    } else if (formData.tipoEvidencia === 'Documentos' && formData.evidenciaDocumento) {
      actividadData.append('archivo', formData.evidenciaDocumento);
    }
    
    // Enviar al backend
    const response = await fetch(`${API_BASE_URL}/actividades`, {
      method: 'POST',
      body: actividadData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar el formulario');
    }
    
    return data;
  } catch (error) {
    console.error('Error en submitForm:', error);
    throw error;
  }
};

/**
 * Obtener actividades de un estudiante
 */
const obtenerActividadesEstudiante = async (estudianteId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/actividades/estudiante/${estudianteId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener actividades');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en obtenerActividadesEstudiante:', error);
    throw error;
  }
};

/**
 * Obtener resumen del estudiante
 */
const obtenerResumenEstudiante = async (estudianteId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/estudiantes/${estudianteId}/resumen`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener resumen');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error en obtenerResumenEstudiante:', error);
    throw error;
  }
};

export const formService = {
  submitForm,
  buscarEstudiante,
  searchEstudiantes,
  obtenerEstudiantes,
  obtenerActividadesEstudiante,
  obtenerResumenEstudiante
};
