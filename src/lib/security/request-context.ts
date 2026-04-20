import 'server-only';

export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
  userId: string | null;
  userRole: string | null;
}

export const getRequestContext = (request: Request): RequestContext => ({
  ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? null,
  userAgent: request.headers.get('user-agent'),
  userId: request.headers.get('x-user-id'),
  userRole: request.headers.get('x-user-role'),
});

export const assertSameOrigin = (request: Request): string | null => {
  const originHeader = request.headers.get('origin');

  if (!originHeader) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (originHeader === requestOrigin || allowedOrigins.includes(originHeader)) {
    return null;
  }

  return 'Solicitud bloqueada por verificación CSRF';
};