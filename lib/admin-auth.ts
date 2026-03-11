import { NextRequest } from 'next/server';
import crypto from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD || 'fallback-secret';

/**
 * Generate an HMAC-signed token that can be verified without in-memory state.
 * Token format: timestamp.signature
 */
export function generateToken(): string {
  const timestamp = Date.now().toString(36);
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(timestamp)
    .digest('hex')
    .slice(0, 24);
  return `${timestamp}.${signature}`;
}

/**
 * Verify a token by re-computing the HMAC signature.
 * Tokens are valid for 24 hours.
 */
export function verifyToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestamp, signature] = parts;

  // Check expiry (24 hours)
  const created = parseInt(timestamp, 36);
  if (isNaN(created) || Date.now() - created > 24 * 60 * 60 * 1000) return false;

  // Verify signature
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(timestamp)
    .digest('hex')
    .slice(0, 24);

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// Keep these for backward compatibility
export function storeToken(_token: string): void {
  // No-op — tokens are now self-verifying
}

export function verifyPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}

/**
 * Middleware helper: extract and verify admin token from request.
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return verifyToken(token);
}
