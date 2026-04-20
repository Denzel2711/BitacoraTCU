import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { fail, ok, serverError } from '@/lib/http';
import { assertSameOrigin } from '@/lib/security/request-context';
import { requireAuthRole } from '@/lib/auth/authorization';

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAuthRole(request, ['Admin']);
    if (authError) {
      return authError;
    }

    const csrfError = assertSameOrigin(request);
    if (csrfError) {
      return fail(csrfError, 403);
    }

    const { id } = await params;
    const body = await request.json();
    const roles = sanitizeRoles(body?.roles ?? body?.rol);
    const activo = typeof body?.activo === 'boolean' ? body.activo : Boolean(body?.activo);

    if (!roles.length) {
      return fail('Debe indicar al menos un rol valido', 400);
    }

    if (roles.includes('Estudiante')) {
      const [linkedStudentRows] = await getPool().query(
        'SELECT estudiante_id FROM usuarios WHERE id = ? LIMIT 1',
        [Number(id)]
      );

      const linkedStudent = (linkedStudentRows as Array<{ estudiante_id: number | null }>)[0]?.estudiante_id;
      if (!linkedStudent) {
        return fail('No se puede asignar rol Estudiante sin vincular un registro de estudiante', 400);
      }
    }

    await getPool().query(
      `UPDATE usuarios
       SET rol = ?, activo = ?
       WHERE id = ?`,
      [roles[0], activo ? 1 : 0, Number(id)]
    );

    await getPool().query('DELETE FROM usuario_roles WHERE usuario_id = ?', [Number(id)]);
    await getPool().query(
      `INSERT INTO usuario_roles (usuario_id, rol)
       VALUES ${roles.map(() => '(?, ?)').join(', ')}`,
      roles.flatMap((role) => [Number(id), role])
    );

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
       WHERE u.id = ?
       LIMIT 1`,
      [Number(id)]
    );

    const user = (rows as Array<{ roles?: string | string[]; [key: string]: unknown }>)[0];
    if (!user) {
      return ok(null, { message: 'Usuario actualizado exitosamente' });
    }

    user.roles = user?.roles
      ? String(user.roles).split(',').map((role) => role.trim()).filter(Boolean)
      : [String(user?.rol ?? '')].filter(Boolean);

    return ok(user ?? null, { message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    return serverError(error);
  }
}