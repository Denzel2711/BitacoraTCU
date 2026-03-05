// Datos de ejemplo de estudiantes (esto debería venir de una API)
export const ESTUDIANTES_MOCK = [
  { 
    cedula: '123456789', 
    nombre: 'Juan', 
    primerApellido: 'Pérez', 
    segundoApellido: 'González', 
    carrera: 'Ingeniería en Software', 
    academicoACargo: 'Dr. Carlos Ramírez', 
    sede: 'San Carlos' 
  },
  { 
    cedula: '987654321', 
    nombre: 'María', 
    primerApellido: 'Rodríguez', 
    segundoApellido: 'Mora', 
    carrera: 'Administración', 
    academicoACargo: 'Dr. Carlos Ramírez', 
    sede: 'Atenas' 
  },
  { 
    cedula: '456789123', 
    nombre: 'Carlos', 
    primerApellido: 'López', 
    segundoApellido: 'Salas', 
    carrera: 'Turismo', 
    academicoACargo: 'Dr. Carlos Ramírez', 
    sede: 'Central' 
  },
];

// Subtipos de actividades de planificación
export const SUBTIPOS_PLANIFICACION = [
  'Inducción, sensibilización y capacitación sobre el proyecto',
  'Elaboración del plan de trabajo y cronograma',
  'Elaboración del informe final del Trabajo Comunal Universitario'
];

// Subtipos de actividades de ejecución
export const SUBTIPOS_EJECUCION = [
  'Desarrollo de actividades de ejecución del proyecto con la organización social comunitaria',
  'Elaboración de los entregables del proyecto',
  'Encuentros académicos reflexivos sobre el proyecto',
  'Sistematización de las experiencias, aprendizajes y resultados'
];

// Tipos de capacitación (para subtipo de planificación)
export const TIPOS_CAPACITACION = [
  'Inducción',
  'Sensibilización',
  'Capacitación sobre el proyecto',
  'Inducción, sensibilización y capacitación en una sola actividad'
];

// Centro de Costa Rica (coordenadas por defecto)
export const COSTA_RICA_CENTER = [9.7489, -83.7534];

// Estado inicial del formulario
export const INITIAL_FORM_DATA = {
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
  descripcionUbicacion: ''
};
