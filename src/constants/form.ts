import type { FormData } from '@/types';

export const SUBTIPOS_PLANIFICACION: string[] = [
  'Inducción, sensibilización y capacitación sobre el proyecto',
  'Elaboración del plan de trabajo y cronograma',
  'Elaboración del informe final del Trabajo Comunal Universitario',
];

export const SUBTIPOS_EJECUCION: string[] = [
  'Desarrollo de actividades de ejecución del proyecto con la organización social comunitaria',
  'Elaboración de los entregables del proyecto',
  'Encuentros académicos reflexivos sobre el proyecto',
  'Sistematización de las experiencias, aprendizajes y resultados',
];

export const TIPOS_CAPACITACION: string[] = [
  'Inducción',
  'Sensibilización',
  'Capacitación sobre el proyecto',
  'Inducción, sensibilización y capacitación en una sola actividad',
];

/** Coordenadas del centro de Costa Rica */
export const COSTA_RICA_CENTER: [number, number] = [9.7489, -83.7534];

export const INITIAL_FORM_DATA: FormData = {
  cedula: '',
  nombre: '',
  primerApellido: '',
  segundoApellido: '',
  carrera: '',
  academicoACargo: '',
  sede: '',
  fechaActividad: '',
  tipoActividad: '',
  subtipoActividad: '',
  tipoCapacitacion: '',
  experienciasAprendizajes: '',
  descripcionActividad: '',
  horaInicio: '',
  horaFinal: '',
  tipoEvidencia: '',
  evidenciaTexto: '',
  evidenciaFoto: null,
  evidenciaDocumento: null,
  ubicacionLat: null,
  ubicacionLng: null,
  descripcionUbicacion: '',
};
