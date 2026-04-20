-- 04_multi_roles.sql
-- Habilita asignacion de multiples roles por usuario.

CREATE TABLE IF NOT EXISTS usuario_roles (
  usuario_id INT NOT NULL,
  rol ENUM('Admin', 'Academico', 'Estudiante') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, rol),
  CONSTRAINT fk_usuario_roles_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

INSERT IGNORE INTO usuario_roles (usuario_id, rol)
SELECT id, rol
FROM usuarios
WHERE rol IN ('Admin', 'Academico', 'Estudiante');
