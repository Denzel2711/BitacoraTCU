import { NextResponse } from 'next/server';
import { fail, serverError } from '@/lib/http';
import { signJwt } from '@/lib/auth/jwt';
import {
  buildRefreshCookieOptions,
  deactivateRefreshSession,
  generateRefreshToken,
  getSessionUserByRefreshHash,
  hashToken,
  saveRefreshSession,
  toExpiryDate,
} from '@/lib/auth/session';
import { getRequestContext } from '@/lib/security/request-context';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const refreshTokenFromCookie = request.cookies.get('refresh_token')?.value;
    const refreshToken = refreshTokenFromCookie || String((await request.json().catch(() => ({})))?.refreshToken || '');

    if (!refreshToken) {
      return fail('Refresh token requerido', 401);
    }

    const refreshHash = hashToken(refreshToken);
    const sessionUser = await getSessionUserByRefreshHash(refreshHash);

    if (!sessionUser) {
      return fail('Sesion invalida o expirada', 401);
    }

    await deactivateRefreshSession(refreshHash);

    const accessSecret = process.env.JWT_SECRET || 'bitacora-tcu-dev-secret';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const { token: accessToken, expiresAt: accessTokenExpiresAt } = signJwt(
      {
        sub: String(sessionUser.id),
        tokenType: 'access',
        role: sessionUser.roles[0] || 'Estudiante',
        roles: sessionUser.roles,
        estudianteId: sessionUser.estudianteId,
        name: sessionUser.nombreCompleto,
        email: sessionUser.email,
        username: sessionUser.nombreUsuario,
      },
      accessSecret,
      accessExpiresIn
    );

    const nextRefreshToken = generateRefreshToken();
    const nextRefreshHash = hashToken(nextRefreshToken);
    const refreshExpiresAt = toExpiryDate(refreshExpiresIn);
    const requestContext = getRequestContext(request);

    await saveRefreshSession(
      sessionUser.id,
      nextRefreshHash,
      refreshExpiresAt,
      requestContext.ip,
      requestContext.userAgent
    );

    const response = NextResponse.json(
      {
        success: true,
        message: 'Token renovado exitosamente',
        data: {
          accessToken,
          accessTokenExpiresAt,
          user: sessionUser,
        },
      },
      { status: 200 }
    );

    response.cookies.set(
      'refresh_token',
      nextRefreshToken,
      buildRefreshCookieOptions(Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000))
    );

    return response;
  } catch (error) {
    return serverError(error);
  }
}
