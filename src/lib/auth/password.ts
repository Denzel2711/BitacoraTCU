import 'server-only';

import { randomBytes, pbkdf2 as pbkdf2Callback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(pbkdf2Callback);

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split('$');

  if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
    return false;
  }

  const [, digest, iterationsText, salt, expectedHash] = parts;
  const iterations = Number(iterationsText);

  if (!Number.isFinite(iterations) || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = await pbkdf2(password, salt, iterations, Buffer.from(expectedHash, 'hex').length, digest);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
};