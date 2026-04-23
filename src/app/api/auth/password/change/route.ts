import type { NextRequest } from 'next/server';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '@/lib/db';
import { fail, serverError } from '@/lib/http';
import { verifyJwt } from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/;

interface UsuarioPasswordRow extends RowDataPacket {
  id: number;
  password_hash: string | null;
  activo: number;
}

const getAccessToken = (request: NextRequest): string | null => {
  const authorization = request.headers.get('authorization') || request.headers.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
};

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return fail('Se requiere autenticacion', 401);
    }

    const jwtSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
    const payload = verifyJwt(accessToken, jwtSecret);

    if (!payload || payload.tokenType !== 'access' || !payload.sub) {
      return fail('Sesion invalida o expirada', 401);
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword = String(body?.currentPassword ?? '');
    const newPassword = String(body?.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      return fail('La contraseña actual y la nueva contraseña son requeridas', 400);
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return fail('La nueva contraseña debe tener entre 12 y 128 caracteres, incluyendo mayúscula, minúscula, número y símbolo.', 400);
    }

    if (currentPassword === newPassword) {
      return fail('La nueva contraseña debe ser diferente a la actual', 400);
    }

    const [rows] = await getPool().query<UsuarioPasswordRow[]>(
      `SELECT id, password_hash, activo
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [Number(payload.sub)]
    );

    const usuario = rows[0];

    if (!usuario || !usuario.activo || !usuario.password_hash) {
      return fail('No autorizado', 403);
    }

    const passwordOk = await verifyPassword(currentPassword, usuario.password_hash);
    if (!passwordOk) {
      return fail('La contraseña actual no es correcta', 401);
    }

    const nextPasswordHash = await hashPassword(newPassword);

    await getPool().query(
      `UPDATE usuarios
       SET password_hash = ?,
           requiere_cambio_password = 0,
           fecha_cambio_password = NOW(),
           intentos_fallidos = 0,
           bloqueado_hasta = NULL
       WHERE id = ?`,
      [nextPasswordHash, usuario.id]
    );

    return Response.json(
      {
        success: true,
        message: 'Contraseña actualizada correctamente',
        data: null,
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError(error);
  }
}
