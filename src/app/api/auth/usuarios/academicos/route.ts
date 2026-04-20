import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { ok, serverError } from '@/lib/http';
import { requireAuthRole } from '@/lib/auth/authorization';

export async function GET(request: NextRequest) {
  try {
    const authError = requireAuthRole(request, ['Admin', 'Academico']);
    if (authError) {
      return authError;
    }

    const [rows] = await getPool().query(
      `SELECT u.id, u.nombre_usuario, u.email, u.nombre_completo
       FROM usuarios u
       INNER JOIN usuario_roles ur ON ur.usuario_id = u.id AND ur.rol = 'Academico'
       WHERE u.activo = 1
       ORDER BY u.nombre_completo ASC`
    );

    return ok(rows, { total: Array.isArray(rows) ? rows.length : 0 });
  } catch (error) {
    return serverError(error);
  }
}