/**
 * Valida que una cédula tenga el formato correcto
 */
export const validateCedula = (cedula) => {
  return cedula && cedula.length >= 9;
};

/**
 * Valida que un campo no esté vacío
 */
export const validateRequired = (value) => {
  return value && value.trim() !== '';
};

/**
 * Valida que la fecha esté dentro del rango permitido (10 días antes de hoy)
 * No puede ser superior a la fecha actual
 */
export const validateFechaActividad = (fecha) => {
  if (!fecha) return { valid: false, message: 'La fecha es requerida' };
  
  const fechaSeleccionada = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaSeleccionada.setHours(0, 0, 0, 0);
  
  const hace10Dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  hace10Dias.setHours(0, 0, 0, 0);
  
  if (fechaSeleccionada > hoy) {
    return { valid: false, message: 'La fecha de inicio no puede ser superior a la actual' };
  }
  
  if (fechaSeleccionada < hace10Dias) {
    return { valid: false, message: 'La fecha de registro no puede pasar de 10 días desde el día que se realizó la actividad' };
  }
  
  return { valid: true };
};

/**
 * Valida que la hora final sea posterior a la hora inicial
 */
export const validateHoras = (horaInicio, horaFinal) => {
  if (!horaInicio || !horaFinal) {
    return { valid: false, message: 'Las horas son requeridas' };
  }
  
  if (horaFinal <= horaInicio) {
    return { valid: false, message: 'La hora de inicio debe ser menor a la hora final' };
  }
  
  return { valid: true };
};

/**
 * Calcula la diferencia de horas entre dos tiempos
 */
const calcularDiferenciaHoras = (horaInicio, horaFinal) => {
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFin, minFin] = horaFinal.split(':').map(Number);
  
  const minutosInicio = horaIni * 60 + minIni;
  const minutosFinal = horaFin * 60 + minFin;
  
  return (minutosFinal - minutosInicio) / 60;
};

/**
 * Valida la cantidad de horas según el tipo de actividad
 * No se pueden hacer más de 8 horas al día, al menos que sea una gira (máximo 12 horas)
 */
export const validateCantidadHoras = (horaInicio, horaFinal, subtipoActividad) => {
  if (!horaInicio || !horaFinal) {
    return { valid: false, message: 'Las horas son requeridas' };
  }
  
  const diferenciaHoras = calcularDiferenciaHoras(horaInicio, horaFinal);
  
  // Verificar si es una gira (transporte)
  const esGira = subtipoActividad && (
    subtipoActividad.toLowerCase().includes('gira') || 
    subtipoActividad.toLowerCase().includes('transporte')
  );
  
  const maxHoras = esGira ? 12 : 8;
  
  if (diferenciaHoras > maxHoras) {
    return { 
      valid: false, 
      message: `No se pueden registrar más de ${maxHoras} horas al día${esGira ? ' (gira/transporte)' : ''}` 
    };
  }
  
  return { valid: true, horas: diferenciaHoras };
};

/**
 * Valida las horas académicas acumuladas (mínimo 10 horas y máximo 30 horas)
 * Nota: Esta validación requeriría conocer las horas previas del estudiante
 */
export const validateHorasAcademicas = (horasAcumuladas, horasNuevas) => {
  const totalHoras = horasAcumuladas + horasNuevas;
  
  if (totalHoras < 10) {
    return { 
      valid: false, 
      message: 'Debe completar un mínimo de 10 horas académicas' 
    };
  }
  
  if (totalHoras > 30) {
    return { 
      valid: false, 
      message: 'No puede exceder las 30 horas académicas' 
    };
  }
  
  return { valid: true };
};

/**
 * Valida la descripción (mínimo 60 caracteres y máximo 250)
 */
export const validateDescripcion = (descripcion) => {
  if (!descripcion || descripcion.trim() === '') {
    return { valid: false, message: 'La descripción es requerida' };
  }
  
  const longitud = descripcion.trim().length;
  
  if (longitud < 60) {
    return { 
      valid: false, 
      message: `La descripción debe tener mínimo 60 caracteres (actual: ${longitud})` 
    };
  }
  
  if (longitud > 250) {
    return { 
      valid: false, 
      message: `La descripción debe tener máximo 250 caracteres (actual: ${longitud})` 
    };
  }
  
  return { valid: true };
};

/**
 * Valida que haya al menos una evidencia seleccionada
 */
export const validateEvidencias = (tipoEvidencia, evidenciaTexto, evidenciaFoto, evidenciaDocumento) => {
  if (!tipoEvidencia || tipoEvidencia === 'No incluye') {
    return { 
      valid: false, 
      message: 'Debe incluir al menos una evidencia (Texto, Foto o Documento)' 
    };
  }
  
  if (tipoEvidencia === 'Texto' && (!evidenciaTexto || evidenciaTexto.trim() === '')) {
    return { 
      valid: false, 
      message: 'Debe proporcionar el texto de la evidencia' 
    };
  }
  
  if (tipoEvidencia === 'Foto' && !evidenciaFoto) {
    return { 
      valid: false, 
      message: 'Debe adjuntar una foto como evidencia' 
    };
  }
  
  if (tipoEvidencia === 'Documentos' && !evidenciaDocumento) {
    return { 
      valid: false, 
      message: 'Debe adjuntar un documento como evidencia' 
    };
  }
  
  return { valid: true };
};

/**
 * Valida que un registro de actividad no contemple 2 días diferentes
 * (la fecha de la actividad debe ser la misma que la fecha actual de registro si es el mismo día)
 */
export const validateMismoDia = (fechaActividad, horaInicio, horaFinal) => {
  // Esta validación asume que la actividad debe completarse en un solo día
  // No necesitamos validar fechas diferentes porque solo hay un campo de fecha
  // La validación de horas ya asegura que hora final > hora inicio en el mismo día
  return { valid: true };
};

/**
 * Valida todo el formulario antes de enviar
 */
export const validateForm = (formData) => {
  const errores = [];
  
  // Validar fecha
  const resultadoFecha = validateFechaActividad(formData.fechaActividad);
  if (!resultadoFecha.valid) errores.push(resultadoFecha.message);
  
  // Validar horas
  const resultadoHoras = validateHoras(formData.horaInicio, formData.horaFinal);
  if (!resultadoHoras.valid) errores.push(resultadoHoras.message);
  
  // Validar cantidad de horas
  if (resultadoHoras.valid) {
    const resultadoCantidad = validateCantidadHoras(
      formData.horaInicio, 
      formData.horaFinal, 
      formData.subtipoActividad
    );
    if (!resultadoCantidad.valid) errores.push(resultadoCantidad.message);
  }
  
  // Validar descripción
  const resultadoDescripcion = validateDescripcion(formData.descripcionActividad);
  if (!resultadoDescripcion.valid) errores.push(resultadoDescripcion.message);
  
  // Validar evidencias
  const resultadoEvidencias = validateEvidencias(
    formData.tipoEvidencia,
    formData.evidenciaTexto,
    formData.evidenciaFoto,
    formData.evidenciaDocumento
  );
  if (!resultadoEvidencias.valid) errores.push(resultadoEvidencias.message);
  
  return {
    valid: errores.length === 0,
    errores
  };
};
