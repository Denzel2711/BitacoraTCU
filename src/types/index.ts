export interface Estudiante {
  id?: number;
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  carrera: string;
  academicoACargo: string;
  sede: string;
  /** Alias columna BD */
  primer_apellido?: string;
  segundo_apellido?: string;
  academico_a_cargo?: string;
}

export interface FormData {
  cedula: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  carrera: string;
  academicoACargo: string;
  sede: string;
  fechaActividad: string;
  tipoActividad: string;
  subtipoActividad: string;
  tipoCapacitacion: string;
  experienciasAprendizajes: string;
  descripcionActividad: string;
  horaInicio: string;
  horaFinal: string;
  tipoEvidencia: string;
  evidenciaTexto: string;
  evidenciaFoto: File | null;
  evidenciaDocumento: File | null;
  ubicacionLat: number | null;
  ubicacionLng: number | null;
  descripcionUbicacion: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  horas?: number;
  errores?: string[];
}
