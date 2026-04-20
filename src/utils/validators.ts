import type { ValidationResult, FormData } from '@/types';

export const validateCedula = (cedula: string): boolean =>
  Boolean(cedula && /^[A-Za-z0-9-]{9,30}$/.test(cedula.trim()));

export const validateRequired = (value: string): boolean =>
  Boolean(value && value.trim() !== '');

export const validateFechaActividad = (fecha: string): ValidationResult => {
  if (!fecha) return { valid: false, message: 'La fecha es requerida' };

  const fechaSeleccionada = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaSeleccionada.setHours(0, 0, 0, 0);

  const hace10Dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  hace10Dias.setHours(0, 0, 0, 0);

  if (fechaSeleccionada > hoy)
    return { valid: false, message: 'La fecha de inicio no puede ser superior a la actual' };

  if (fechaSeleccionada < hace10Dias)
    return { valid: false, message: 'La fecha de registro no puede pasar de 10 días desde el día que se realizó la actividad' };

  return { valid: true };
};

export const validateHoras = (horaInicio: string, horaFinal: string): ValidationResult => {
  if (!horaInicio || !horaFinal) return { valid: false, message: 'Las horas son requeridas' };
  if (horaFinal <= horaInicio) return { valid: false, message: 'La hora de inicio debe ser menor a la hora final' };
  return { valid: true };
};

const calcularDiferenciaHoras = (horaInicio: string, horaFinal: string): number => {
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFin, minFin] = horaFinal.split(':').map(Number);
  return ((horaFin * 60 + minFin) - (horaIni * 60 + minIni)) / 60;
};

export const validateCantidadHoras = (
  horaInicio: string,
  horaFinal: string,
  subtipoActividad: string
): ValidationResult => {
  if (!horaInicio || !horaFinal) return { valid: false, message: 'Las horas son requeridas' };

  const diferenciaHoras = calcularDiferenciaHoras(horaInicio, horaFinal);
  const esGira = subtipoActividad?.toLowerCase().includes('gira') ||
                 subtipoActividad?.toLowerCase().includes('transporte');
  const maxHoras = esGira ? 12 : 8;

  if (diferenciaHoras > maxHoras)
    return { valid: false, message: `No se pueden registrar más de ${maxHoras} horas al día${esGira ? ' (gira/transporte)' : ''}` };

  return { valid: true, horas: diferenciaHoras };
};

export const validateHorasAcademicas = (horasAcumuladas: number, horasNuevas: number): ValidationResult => {
  const totalHoras = horasAcumuladas + horasNuevas;
  if (totalHoras < 10) return { valid: false, message: 'Debe completar un mínimo de 10 horas académicas' };
  if (totalHoras > 30) return { valid: false, message: 'No puede exceder las 30 horas académicas' };
  return { valid: true };
};

export const validateForm = (formData: FormData): { valid: boolean; errores: string[] } => {
  const errores: string[] = [];

  if (!validateCedula(formData.cedula as string)) errores.push('La cédula debe tener entre 9 y 30 caracteres alfanuméricos.');
  if (!validateRequired(formData.fechaActividad as string)) errores.push('La fecha de la actividad es requerida.');
  if (!validateRequired(formData.tipoActividad as string)) errores.push('El tipo de actividad es requerido.');
  if (!validateRequired(formData.subtipoActividad as string)) errores.push('El subtipo de actividad es requerido.');
  if (!validateRequired(formData.descripcionActividad as string)) errores.push('La descripción de la actividad es requerida.');
  if (!validateRequired(formData.horaInicio as string)) errores.push('La hora de inicio es requerida.');
  if (!validateRequired(formData.horaFinal as string)) errores.push('La hora final es requerida.');
  if (!validateRequired(formData.tipoEvidencia as string)) errores.push('El tipo de evidencia es requerido.');

  const fechaResult = validateFechaActividad(formData.fechaActividad as string);
  if (!fechaResult.valid) errores.push(fechaResult.message!);

  if (formData.horaInicio && formData.horaFinal) {
    const horasResult = validateHoras(formData.horaInicio as string, formData.horaFinal as string);
    if (!horasResult.valid) errores.push(horasResult.message!);
  }

  return { valid: errores.length === 0, errores };
};
