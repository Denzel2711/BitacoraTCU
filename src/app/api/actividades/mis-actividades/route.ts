import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import ActividadModel from '@/lib/db/models/actividad.model';
import EvidenciaModel from '@/lib/db/models/evidencia.model';
import { fail, ok, serverError } from '@/lib/http';
import { verifyJwt } from '@/lib/auth/jwt';
import type { RowDataPacket } from 'mysql2';

interface UsuarioEstudianteRow extends RowDataPacket {
  estudiante_id: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return fail('Se requiere autenticacion', 401);
    }

    const token = authorization.slice('Bearer '.length).trim();
    const jwtSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
    const payload = verifyJwt(token, jwtSecret);

    if (!payload || payload.tokenType !== 'access' || !payload.sub) {
      return fail('Sesion invalida o expirada', 401);
    }

    const roles = Array.isArray(payload.roles)
      ? payload.roles
      : payload.role
        ? [payload.role]
        : [];

    if (!roles.includes('Estudiante')) {
      return fail('No autorizado', 403);
    }

    const [userRows] = await getPool().query<UsuarioEstudianteRow[]>(
      `SELECT estudiante_id
       FROM usuarios
       WHERE id = ? AND activo = 1
       LIMIT 1`,
      [Number(payload.sub)]
    );

    const estudianteId = userRows[0]?.estudiante_id;
    if (!estudianteId) {
      return fail('No hay un estudiante asociado a la sesión actual', 403);
    }

    const actividades = await ActividadModel.findByEstudiante(estudianteId);
    const actividadesPeriodoActivo = actividades.filter((actividad) => actividad.matriculacion_estado === 'Activa');

    const actividadesConEvidencias = await Promise.all(
      actividadesPeriodoActivo.map(async (actividad) => {
        const evidencias = await EvidenciaModel.findByActividad(Number(actividad.id));
        return {
          ...actividad,
          evidencias,
        };
      })
    );

    return ok(actividadesConEvidencias, {
      total: actividadesConEvidencias.length,
      estudianteId,
    });
  } catch (error) {
    return serverError(error);
  }
}
