import 'server-only';

import { createHash, randomBytes } from 'crypto';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '@/lib/db';
import { parseExpiration } from '@/lib/auth/jwt';

export interface AuthUser {
  id: number;
  nombreUsuario: string;
  email: string;
  nombreCompleto: string;
  roles: Array<'Admin' | 'Academico' | 'Estudiante'>;
  estudianteId: number | null;
  requiereCambioPassword: boolean;
}

export const generateRefreshToken = (): string => randomBytes(48).toString('base64url');

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const toExpiryDate = (expiresIn: string): Date => {
  const seconds = parseExpiration(expiresIn);
  return new Date(Date.now() + seconds * 1000);
};

export const saveRefreshSession = async (
  userId: number,
  refreshTokenHash: string,
  expiresAt: Date,
  ip: string | null,
  userAgent: string | null
): Promise<void> => {
  await getPool().query(
    `INSERT INTO sesiones_jwt (usuario_id, token_hash, fecha_expiracion, activo, direccion_ip, user_agent)
     VALUES (?, ?, ?, 1, ?, ?)`,
    [userId, refreshTokenHash, expiresAt, ip, userAgent]
  );
};

export const deactivateRefreshSession = async (refreshTokenHash: string): Promise<void> => {
  await getPool().query(
    `UPDATE sesiones_jwt
     SET activo = 0
     WHERE token_hash = ?`,
    [refreshTokenHash]
  );
};

export const getSessionUserByRefreshHash = async (refreshTokenHash: string): Promise<AuthUser | null> => {
  interface SessionUserRow extends RowDataPacket {
    id: number;
    nombre_usuario: string;
    email: string;
    nombre_completo: string;
    rol: 'Admin' | 'Academico' | 'Estudiante';
    estudiante_id: number | null;
    roles: string | null;
    requiere_cambio_password: number;
  }

  const [rows] = await getPool().query<
    SessionUserRow[]
  >(
    `SELECT
       u.id,
       u.nombre_usuario,
       u.email,
       u.nombre_completo,
       u.rol,
       u.estudiante_id,
       u.requiere_cambio_password,
       (
         SELECT GROUP_CONCAT(ur.rol ORDER BY FIELD(ur.rol, 'Admin', 'Academico', 'Estudiante') SEPARATOR ',')
         FROM usuario_roles ur
         WHERE ur.usuario_id = u.id
       ) AS roles
     FROM sesiones_jwt s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token_hash = ?
       AND s.activo = 1
       AND s.fecha_expiracion > NOW()
       AND u.activo = 1
     LIMIT 1`,
    [refreshTokenHash]
  );

  const user = rows[0];

  if (!user) {
    return null;
  }

  const roles = (user.roles || user.rol)
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean) as Array<'Admin' | 'Academico' | 'Estudiante'>;

  return {
    id: user.id,
    nombreUsuario: user.nombre_usuario,
    email: user.email,
    nombreCompleto: user.nombre_completo,
    roles,
    estudianteId: user.estudiante_id,
    requiereCambioPassword: Boolean(user.requiere_cambio_password),
  };
};

export const buildRefreshCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: maxAgeSeconds,
});
