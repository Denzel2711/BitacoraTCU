-- Seguridad, trazabilidad y soporte institucional para BitacoraTCU.
-- Ajusta este script al esquema real antes de ejecutarlo en produccion.

ALTER TABLE estudiantes
  MODIFY COLUMN cedula VARCHAR(30) NOT NULL;

ALTER TABLE estudiantes
  ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS modificado_por VARCHAR(100) NULL;

ALTER TABLE actividades
  ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS modificado_por VARCHAR(100) NULL;

ALTER TABLE evidencias
  ADD COLUMN IF NOT EXISTS creado_por VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS modificado_por VARCHAR(100) NULL;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol_id INT NULL,
  ADD COLUMN IF NOT EXISTS estudiante_id INT NULL,
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_hasta DATETIME NULL,
  ADD COLUMN IF NOT EXISTS ultimo_login DATETIME NULL,
  ADD COLUMN IF NOT EXISTS activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE usuarios
  ADD UNIQUE KEY uq_usuarios_estudiante_id (estudiante_id);

ALTER TABLE usuarios
  ADD CONSTRAINT fk_usuarios_estudiante
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id)
    ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id INT NOT NULL,
  permiso_id INT NOT NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rol_permisos_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_rol_permisos_permiso FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matriculaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  codigo_proyecto VARCHAR(50) NOT NULL,
  periodo_academico VARCHAR(20) NOT NULL,
  estado ENUM('Activa', 'Finalizada', 'Retirada') NOT NULL DEFAULT 'Activa',
  observaciones VARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_matriculacion_estudiante_proyecto_periodo (estudiante_id, codigo_proyecto, periodo_academico),
  CONSTRAINT fk_matriculaciones_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_cambios_actividades (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actividad_id INT NOT NULL,
  accion VARCHAR(20) NOT NULL,
  estado_anterior VARCHAR(30) NULL,
  estado_nuevo VARCHAR(30) NULL,
  observaciones VARCHAR(500) NULL,
  aprobado_por VARCHAR(100) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_actividad FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sesiones_jwt (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  jti VARCHAR(128) NOT NULL UNIQUE,
  expiracion DATETIME NOT NULL,
  revocada TINYINT(1) NOT NULL DEFAULT 0,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(100) NOT NULL,
  accion VARCHAR(20) NOT NULL,
  registro_id VARCHAR(64) NULL,
  descripcion VARCHAR(255) NOT NULL,
  datos_anteriores JSON NULL,
  datos_nuevos JSON NULL,
  usuario VARCHAR(100) NULL,
  rol VARCHAR(100) NULL,
  ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auditoria_tabla_fecha (tabla_afectada, creado_en),
  INDEX idx_auditoria_registro (tabla_afectada, registro_id)
);

DELIMITER $$

CREATE PROCEDURE sp_registrar_auditoria(
  IN p_tabla_afectada VARCHAR(100),
  IN p_accion VARCHAR(20),
  IN p_registro_id VARCHAR(64),
  IN p_descripcion VARCHAR(255),
  IN p_datos_anteriores JSON,
  IN p_datos_nuevos JSON,
  IN p_usuario VARCHAR(100),
  IN p_rol VARCHAR(100),
  IN p_ip VARCHAR(45),
  IN p_user_agent VARCHAR(255)
)
BEGIN
  INSERT INTO auditoria (
    tabla_afectada,
    accion,
    registro_id,
    descripcion,
    datos_anteriores,
    datos_nuevos,
    usuario,
    rol,
    ip,
    user_agent
  ) VALUES (
    p_tabla_afectada,
    p_accion,
    p_registro_id,
    p_descripcion,
    p_datos_anteriores,
    p_datos_nuevos,
    p_usuario,
    p_rol,
    p_ip,
    p_user_agent
  );
END$$

CREATE TRIGGER trg_estudiantes_ai
AFTER INSERT ON estudiantes
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'estudiantes',
    'CREATE',
    CAST(NEW.id AS CHAR),
    'Insercion de estudiante',
    NULL,
    JSON_OBJECT(
      'id', NEW.id,
      'cedula', NEW.cedula,
      'nombre', NEW.nombre,
      'primer_apellido', NEW.primer_apellido,
      'segundo_apellido', NEW.segundo_apellido,
      'carrera', NEW.carrera,
      'sede', NEW.sede,
      'activo', NEW.activo
    ),
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_estudiantes_au
AFTER UPDATE ON estudiantes
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'estudiantes',
    'UPDATE',
    CAST(NEW.id AS CHAR),
    'Actualizacion de estudiante',
    JSON_OBJECT(
      'id', OLD.id,
      'cedula', OLD.cedula,
      'nombre', OLD.nombre,
      'primer_apellido', OLD.primer_apellido,
      'segundo_apellido', OLD.segundo_apellido,
      'carrera', OLD.carrera,
      'sede', OLD.sede,
      'activo', OLD.activo
    ),
    JSON_OBJECT(
      'id', NEW.id,
      'cedula', NEW.cedula,
      'nombre', NEW.nombre,
      'primer_apellido', NEW.primer_apellido,
      'segundo_apellido', NEW.segundo_apellido,
      'carrera', NEW.carrera,
      'sede', NEW.sede,
      'activo', NEW.activo
    ),
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_estudiantes_ad
AFTER DELETE ON estudiantes
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'estudiantes',
    'DELETE',
    CAST(OLD.id AS CHAR),
    'Eliminacion de estudiante',
    JSON_OBJECT(
      'id', OLD.id,
      'cedula', OLD.cedula,
      'nombre', OLD.nombre,
      'primer_apellido', OLD.primer_apellido,
      'segundo_apellido', OLD.segundo_apellido,
      'carrera', OLD.carrera,
      'sede', OLD.sede,
      'activo', OLD.activo
    ),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_actividades_ai
AFTER INSERT ON actividades
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'actividades',
    'CREATE',
    CAST(NEW.id AS CHAR),
    'Insercion de actividad',
    NULL,
    JSON_OBJECT(
      'id', NEW.id,
      'estudiante_id', NEW.estudiante_id,
      'fecha_actividad', NEW.fecha_actividad,
      'estado', NEW.estado,
      'horas_trabajadas', NEW.horas_trabajadas,
      'tipo_actividad', NEW.tipo_actividad,
      'subtipo_actividad', NEW.subtipo_actividad
    ),
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_actividades_au
AFTER UPDATE ON actividades
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'actividades',
    'UPDATE',
    CAST(NEW.id AS CHAR),
    'Actualizacion de actividad',
    JSON_OBJECT(
      'id', OLD.id,
      'estudiante_id', OLD.estudiante_id,
      'fecha_actividad', OLD.fecha_actividad,
      'estado', OLD.estado,
      'horas_trabajadas', OLD.horas_trabajadas,
      'tipo_actividad', OLD.tipo_actividad,
      'subtipo_actividad', OLD.subtipo_actividad
    ),
    JSON_OBJECT(
      'id', NEW.id,
      'estudiante_id', NEW.estudiante_id,
      'fecha_actividad', NEW.fecha_actividad,
      'estado', NEW.estado,
      'horas_trabajadas', NEW.horas_trabajadas,
      'tipo_actividad', NEW.tipo_actividad,
      'subtipo_actividad', NEW.subtipo_actividad
    ),
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_actividades_ad
AFTER DELETE ON actividades
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'actividades',
    'DELETE',
    CAST(OLD.id AS CHAR),
    'Eliminacion de actividad',
    JSON_OBJECT(
      'id', OLD.id,
      'estudiante_id', OLD.estudiante_id,
      'fecha_actividad', OLD.fecha_actividad,
      'estado', OLD.estado,
      'horas_trabajadas', OLD.horas_trabajadas,
      'tipo_actividad', OLD.tipo_actividad,
      'subtipo_actividad', OLD.subtipo_actividad
    ),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_evidencias_ai
AFTER INSERT ON evidencias
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'evidencias',
    'CREATE',
    CAST(NEW.id AS CHAR),
    'Insercion de evidencia',
    NULL,
    JSON_OBJECT(
      'id', NEW.id,
      'actividad_id', NEW.actividad_id,
      'tipo_evidencia', NEW.tipo_evidencia,
      'nombre_archivo', NEW.nombre_archivo,
      'ruta_archivo', NEW.ruta_archivo
    ),
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

CREATE TRIGGER trg_evidencias_ad
AFTER DELETE ON evidencias
FOR EACH ROW
BEGIN
  CALL sp_registrar_auditoria(
    'evidencias',
    'DELETE',
    CAST(OLD.id AS CHAR),
    'Eliminacion de evidencia',
    JSON_OBJECT(
      'id', OLD.id,
      'actividad_id', OLD.actividad_id,
      'tipo_evidencia', OLD.tipo_evidencia,
      'nombre_archivo', OLD.nombre_archivo,
      'ruta_archivo', OLD.ruta_archivo
    ),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  );
END$$

DELIMITER ;