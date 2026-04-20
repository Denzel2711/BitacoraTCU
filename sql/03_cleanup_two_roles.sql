-- Limpieza y alineacion de esquema para flujo de 2 roles: Admin y Estudiante.
-- Requisitos funcionales actuales:
-- 1) Estudiante: solo inicia sesion y registra actividades/evidencias.
-- 2) Admin (tutor/profesor): administra usuarios/estudiantes y revisa registros.

UPDATE usuarios
SET rol = 'Admin'
WHERE rol = 'Academico';

-- Eliminar relacion legacy con tabla roles y columna rol_id.
ALTER TABLE usuarios DROP FOREIGN KEY usuarios_ibfk_1;
ALTER TABLE usuarios DROP COLUMN rol_id;

ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('Admin', 'Estudiante') NOT NULL DEFAULT 'Estudiante';

-- Eliminar objetos RBAC legacy no usados por la app actual.
DROP TABLE IF EXISTS rol_permisos;
DROP TABLE IF EXISTS permisos;
DROP TABLE IF EXISTS roles;

-- Eliminar tabla de sesiones legacy (la app usa sesiones_jwt).
DROP TABLE IF EXISTS sesiones;

-- Eliminar historial legacy no usado por la app actual.
DROP TABLE IF EXISTS historial_cambios_actividades;

-- Eliminar triggers duplicados de auditoria para evitar registros repetidos.
DROP TRIGGER IF EXISTS trg_auditoria_estudiantes_insert;
DROP TRIGGER IF EXISTS trg_auditoria_estudiantes_update;
DROP TRIGGER IF EXISTS trg_auditoria_actividades_insert;
DROP TRIGGER IF EXISTS trg_auditoria_actividades_update;
