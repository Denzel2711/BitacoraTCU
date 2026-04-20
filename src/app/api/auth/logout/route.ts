import { NextResponse } from 'next/server';
import { serverError } from '@/lib/http';
import { deactivateRefreshSession, hashToken } from '@/lib/auth/session';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (refreshToken) {
      await deactivateRefreshSession(hashToken(refreshToken));
    }

    const response = NextResponse.json(
      {
        success: true,
        data: null,
        message: 'Sesion cerrada correctamente',
      },
      { status: 200 }
    );

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return serverError(error);
  }
}
