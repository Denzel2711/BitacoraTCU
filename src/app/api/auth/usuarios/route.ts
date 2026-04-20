import { NextResponse } from 'next/server';
import type { ResultSetHeader } from 'mysql2';
import { getPool } from '@/lib/db';
import { fail, ok, serverError } from '@/lib/http';
import { signJwt } from '@/lib/auth/jwt';
import { hashPassword } from '@/lib/auth/password';
import { assertSameOrigin } from '@/lib/security/request-context';
import { requireAuthRole } from '@/lib/auth/authorization';
import {
  buildRefreshCookieOptions,
  generateRefreshToken,
  hashToken,
  saveRefreshSession,
  toExpiryDate,
} from '@/lib/auth/session';
import { getRequestContext } from '@/lib/security/request-context';
import type { NextRequest } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/;

const ALLOWED_ROLES = ['Admin', 'Academico', 'Estudiante'] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

const sanitizeRoles = (rolesInput: unknown): AllowedRole[] => {
  const roles = Array.isArray(rolesInput)
    ? rolesInput
    : rolesInput
      ? [rolesInput]
      : [];

  const normalized = roles
    .map((role) => String(role).trim())
    .filter((role): role is AllowedRole => ALLOWED_ROLES.includes(role as AllowedRole));

  return Array.from(new Set(normalized));
};

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin']);
    if (authError) {
      return authError;
    }

    const [rows] = await getPool().query(
      `SELECT
         u.id,
         u.nombre_usuario,
         u.email,
         u.nombre_completo,
         u.rol,
         u.estudiante_id,
         u.activo,
         u.ultimo_login,
         u.intentos_fallidos,
         u.bloqueado_hasta,
         (
           SELECT GROUP_CONCAT(ur.rol ORDER BY FIELD(ur.rol, 'Admin', 'Academico', 'Estudiante') SEPARATOR ',')
           FROM usuario_roles ur
           WHERE ur.usuario_id = u.id
         ) AS roles
       FROM usuarios u
       ORDER BY u.nombre_completo ASC`
    );

    const users = (rows as Array<{ roles?: string; [key: string]: unknown }>).map((user) => ({
      ...user,
      roles: user.roles
        ? String(user.roles).split(',').map((role) => role.trim()).filter(Boolean)
        : [String(user.rol)],
    }));

    return ok(users, { total: users.length });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin']);
    if (authError) {
      return authError;
    }

    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const body = await request.json();
    const nombreUsuario = String(body?.nombreUsuario ?? body?.username ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const nombreCompleto = String(body?.nombreCompleto ?? body?.nombre ?? '').trim();
    const password = String(body?.password ?? '');
    const roles = sanitizeRoles(body?.roles ?? body?.rol);

    if (!nombreUsuario || !email || !nombreCompleto || !password) {
      return fail('nombreUsuario, email, nombreCompleto y password son requeridos', 400);
    }

    if (!roles.length) {
      return fail('Debe seleccionar al menos un rol valido', 400);
    }

    if (roles.includes('Estudiante')) {
      return fail('Los usuarios con rol Estudiante deben registrarse desde el modulo de registro de estudiantes', 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      return fail('El email no tiene un formato valido', 400);
    }

    if (!PASSWORD_REGEX.test(password)) {
      return fail('La contraseña debe tener 12+ caracteres, mayúsculas, minúsculas, números y símbolos', 400);
    }

    const passwordHash = await hashPassword(password);

    const [result] = await getPool().query<ResultSetHeader>(
      `INSERT INTO usuarios (
        nombre_usuario,
        email,
        password_hash,
        nombre_completo,
        rol,
        activo,
        intentos_fallidos,
        requiere_cambio_password,
        fecha_cambio_password
      ) VALUES (?, ?, ?, ?, ?, 1, 0, 0, NOW())`,
      [nombreUsuario, email, passwordHash, nombreCompleto, roles[0]]
    );

    await getPool().query(
      `INSERT INTO usuario_roles (usuario_id, rol)
       VALUES ${roles.map(() => '(?, ?)').join(', ')}`,
      roles.flatMap((role) => [result.insertId, role])
    );

    const accessSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signJwt(
      {
        sub: String(result.insertId),
        tokenType: 'access',
        role: roles[0],
        roles,
        estudianteId: null,
        name: nombreCompleto,
        email,
        username: nombreUsuario,
      },
      accessSecret,
      accessExpiresIn
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = toExpiryDate(refreshExpiresIn);
    const requestContext = getRequestContext(request);

    await saveRefreshSession(
      result.insertId,
      refreshTokenHash,
      refreshExpiresAt,
      requestContext.ip,
      requestContext.userAgent
    );

    const response = NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
          accessToken,
          accessTokenExpiresAt,
          user: {
            id: result.insertId,
            nombreUsuario,
            nombreCompleto,
            email,
            roles,
            estudianteId: null,
          },
        },
      },
      { status: 201 }
    );

    response.cookies.set(
      'refresh_token',
      refreshToken,
      buildRefreshCookieOptions(Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000))
    );

    return response;
  } catch (error) {
    if ((error as NodeJS.ErrnoException & { code?: string })?.code === 'ER_DUP_ENTRY') {
      return fail('El nombre de usuario o email ya existe', 409);
    }

    return serverError(error);
  }
}