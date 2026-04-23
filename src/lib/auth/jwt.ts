import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

export interface JwtPayload {
  sub: string;
  tokenType?: 'access' | 'refresh';
  role?: string | null;
  roles?: string[];
  estudianteId?: number | null;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  requiereCambioPassword?: boolean;
  jti?: string;
  iat?: number;
  exp?: number;
}

const base64UrlEncode = (value: Buffer | string): string => Buffer.from(value).toString('base64url');

const base64UrlDecode = (value: string): string => Buffer.from(value, 'base64url').toString('utf8');

export const parseExpiration = (value: string): number => {
  const normalized = value.trim().toLowerCase();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const match = normalized.match(/^(\d+)([smhd])$/);

  if (!match) {
    return 8 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return amount;
    case 'm': return amount * 60;
    case 'h': return amount * 60 * 60;
    case 'd': return amount * 24 * 60 * 60;
    default: return 8 * 60 * 60;
  }
};

export const signJwt = (payload: JwtPayload, secret: string, expiresIn = '8h'): { token: string; expiresAt: string } => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresInSeconds = parseExpiration(expiresIn);
  const jwtPayload = {
    ...payload,
    jti: randomUUID(),
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url');

  return {
    token: `${unsignedToken}.${signature}`,
    expiresAt: new Date((issuedAt + expiresInSeconds) * 1000).toISOString(),
  };
};

export const verifyJwt = (token: string, secret: string): JwtPayload | null => {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', secret).update(unsignedToken).digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return null;
    }

    if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;

    if (!payload?.sub || !payload?.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};