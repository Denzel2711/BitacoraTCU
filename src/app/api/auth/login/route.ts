import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '@/lib/db';
import { fail, serverError } from '@/lib/http';
import { signJwt } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import {
  buildRefreshCookieOptions,
  generateRefreshToken,
  hashToken,
  saveRefreshSession,
  toExpiryDate,
} from '@/lib/auth/session';
import type { NextRequest } from 'next/server';
import { getRequestContext } from '@/lib/security/request-context';

interface UsuarioLoginRow extends RowDataPacket {
  id: number;
  nombre_usuario: string;
  email: string;
  nombre_completo: string;
  rol: 'Admin' | 'Academico' | 'Estudiante';
  roles: string | null;
  estudiante_id: number | null;
  matricula_activa_id: number | null;
  password_hash: string | null;
  activo: number;
  intentos_fallidos: number;
  bloqueado_hasta: string | Date | null;
}

const isLocked = (bloqueadoHasta: string | Date | null): boolean => {
  if (!bloqueadoHasta) {
    return false;
  }

  return new Date(bloqueadoHasta).getTime() > Date.now();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = String(body?.identifier ?? body?.email ?? body?.nombreUsuario ?? '').trim();
    const password = String(body?.password ?? '');
    const numericIdentifier = /^\d+$/.test(identifier) ? Number(identifier) : null;

    if (!identifier || !password) {
      return fail('El identificador y la contraseña son requeridos', 400);
    }

    const [rows] = await getPool().query<UsuarioLoginRow[]>(
      `SELECT
         u.id,
         u.nombre_usuario,
         u.email,
         u.nombre_completo,
         u.rol,
         (
           SELECT GROUP_CONCAT(ur.rol ORDER BY FIELD(ur.rol, 'Admin', 'Academico', 'Estudiante') SEPARATOR ',')
           FROM usuario_roles ur
           WHERE ur.usuario_id = u.id
         ) AS roles,
         u.estudiante_id,
         u.password_hash,
         u.activo,
         u.intentos_fallidos,
         u.bloqueado_hasta,
         m.id AS matricula_activa_id
       FROM usuarios u
       LEFT JOIN matriculaciones m
         ON m.estudiante_id = u.estudiante_id
        AND m.estado = 'Activa'
        AND m.activo = 1
       WHERE u.email = ? OR u.nombre_usuario = ? OR (? IS NOT NULL AND u.id = ?)
       LIMIT 1`,
      [identifier, identifier, numericIdentifier, numericIdentifier]
    );

    const usuario = rows[0];

    if (!usuario || !usuario.activo || !usuario.password_hash) {
      return fail('Credenciales invalidas', 401);
    }

    const roles = (usuario.roles || usuario.rol)
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean) as Array<'Admin' | 'Academico' | 'Estudiante'>;

    if (roles.length === 0) {
      return fail('El rol de este usuario ya no esta soportado. Contacta al administrador.', 403);
    }

    if (isLocked(usuario.bloqueado_hasta)) {
      return fail('La cuenta se encuentra bloqueada temporalmente', 423);
    }

    if (roles.includes('Estudiante') && (!usuario.estudiante_id || !usuario.matricula_activa_id)) {
      return fail('Tu cuenta no tiene una matricula activa de TCU. Contacta al tutor para habilitarla.', 403);
    }

    const passwordOk = await verifyPassword(password, usuario.password_hash);

    if (!passwordOk) {
      const nextAttempts = (usuario.intentos_fallidos || 0) + 1;
      const shouldLock = nextAttempts >= 5;

      await getPool().query(
        `UPDATE usuarios
         SET intentos_fallidos = ?, bloqueado_hasta = ?
         WHERE id = ?`,
        [nextAttempts, shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null, usuario.id]
      );

      return fail('Credenciales invalidas', 401);
    }

    const jwtSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const accessSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const { token: accessToken, expiresAt: accessExpiresAt } = signJwt(
      {
        sub: String(usuario.id),
        tokenType: 'access',
        role: roles[0] || usuario.rol,
        roles,
        estudianteId: usuario.estudiante_id,
        name: usuario.nombre_completo,
        email: usuario.email,
        username: usuario.nombre_usuario,
      },
      accessSecret,
      accessExpiresIn
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = toExpiryDate(refreshExpiresIn);
    const requestContext = getRequestContext(request);

    await saveRefreshSession(
      usuario.id,
      refreshTokenHash,
      refreshExpiresAt,
      requestContext.ip,
      requestContext.userAgent
    );

    await getPool().query(
      `UPDATE usuarios
       SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW(), ultimo_acceso = NOW()
       WHERE id = ?`,
      [usuario.id]
    );

    const response = NextResponse.json(
      {
        success: true,
        message: 'Inicio de sesion exitoso',
        data: {
          accessToken,
          accessTokenExpiresAt: accessExpiresAt,
          user: {
            id: usuario.id,
            nombreUsuario: usuario.nombre_usuario,
            nombreCompleto: usuario.nombre_completo,
            email: usuario.email,
            roles,
            estudianteId: usuario.estudiante_id,
          },
        },
      },
      { status: 200 }
    );

    response.cookies.set(
      'refresh_token',
      refreshToken,
      buildRefreshCookieOptions(Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000))
    );

    return response;
  } catch (error) {
    return serverError(error);
  }
}