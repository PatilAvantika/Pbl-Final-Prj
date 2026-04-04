/** Fail-fast JWT config. Used by AuthModule, JwtStrategy, and AuthController (cookie maxAge). */
export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) {
    throw new Error(
      'JWT_SECRET environment variable is required and must be non-empty',
    );
  }
  return s;
}

/** Seconds until access token (and auth cookie) expire. Single source of truth. */
export function getJwtExpiresSec(): number {
  const raw = process.env.JWT_EXPIRES_SEC?.trim();
  const n = raw !== undefined && raw !== '' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      'JWT_EXPIRES_SEC environment variable is required: positive integer (seconds)',
    );
  }
  return n;
}
