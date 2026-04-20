import 'server-only';

import { fail } from '@/lib/http';
import { verifyJwt } from '@/lib/auth/jwt';

export type AppRole = 'Admin' | 'Academico' | 'Estudiante';

const getAccessToken = (request: Request): string | null => {
  const authorization = request.headers.get('authorization') || request.headers.get('Authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length).trim() || null;
};

export const requireAuthRole = (request: Request, allowedRoles: AppRole[]) => {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return fail('Se requiere autenticacion', 401);
  }

  const jwtSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
  const payload = verifyJwt(accessToken, jwtSecret);

  const payloadRoles = Array.isArray(payload?.roles)
    ? payload.roles
    : payload?.role
      ? [payload.role]
      : [];

  const authorized = payloadRoles.some((role) => allowedRoles.includes(role as AppRole));

  if (!payload || payload.tokenType !== 'access' || !authorized) {
    return fail('No autorizado', 403);
  }

  return null;
};
