-- Crear vistas para unificar datos de actividades con estudiantes y matrículas
-- Permite visualizar actividades de múltiples períodos de matrícula (actual y pasados)

-- Eliminamos la vista si ya existe para poder recrearla
DROP VIEW IF EXISTS vista_actividades_completas;

-- Crear vista que une actividades con información de estudiantes y matrículas
-- Incluye todas las actividades de todos los períodos del estudiante
CREATE VIEW vista_actividades_completas AS
SELECT
  a.id,
  a.estudiante_id,
  e.cedula,
  a.fecha_actividad,
  a.tipo_actividad,
  a.subtipo_actividad,
  a.tipo_capacitacion,
  a.experiencias_aprendizajes,
  a.descripcion_actividad,
  a.hora_inicio,
  a.hora_final,
  CAST(
    CASE 
      WHEN a.hora_final IS NOT NULL AND a.hora_inicio IS NOT NULL 
      THEN HOUR(TIMEDIFF(a.hora_final, a.hora_inicio)) + (MINUTE(TIMEDIFF(a.hora_final, a.hora_inicio)) / 60.0)
      ELSE 0
    END AS DECIMAL(5,2)
  ) AS horas_trabajadas,
  a.ubicacion_lat,
  a.ubicacion_lng,
  a.descripcion_ubicacion,
  COALESCE(a.estado, 'Pendiente') AS estado,
  a.fecha_registro,
  a.creado_por,
  a.modificado_por,
  a.matriculacion_id,
  m.periodo,
  m.fecha_inicio,
  m.fecha_fin,
  m.estado AS matriculacion_estado
FROM actividades a
INNER JOIN estudiantes e ON a.estudiante_id = e.id
LEFT JOIN matriculaciones m ON a.matriculacion_id = m.id
WHERE e.activo = 1
ORDER BY m.periodo DESC, a.fecha_actividad DESC;
