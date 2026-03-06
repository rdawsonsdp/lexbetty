import { NextRequest } from 'next/server';

const TOKEN_PREFIX = 'caterpro_admin_';

export function generateToken(): string {
  const random = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return TOKEN_PREFIX + random;
}

// In-memory token store (valid for server lifetime)
const validTokens = new Set<string>();

export function storeToken(token: string): void {
  validTokens.add(token);
}

export function verifyToken(token: string): boolean {
  return validTokens.has(token);
}

export function verifyPassword(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD;
}

/**
 * Middleware helper: extract and verify admin token from request.
 * Returns true if authorized.
 */
export function isAdminAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return verifyToken(token);
}
