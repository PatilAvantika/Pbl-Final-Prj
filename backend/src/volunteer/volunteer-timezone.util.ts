import { BadRequestException } from '@nestjs/common';
import { DateTime } from 'luxon';

const DEFAULT_TZ = 'UTC';

/** Normalize and validate IANA timezone; throws 400 if invalid. */
export function resolveIanaTimeZone(raw?: string | null): string {
  const trimmed = (raw ?? DEFAULT_TZ).trim() || DEFAULT_TZ;
  const dt = DateTime.now().setZone(trimmed);
  if (!dt.isValid) {
    throw new BadRequestException({
      code: 'INVALID_TIMEZONE',
      message: `Invalid IANA timezone: ${trimmed}`,
    });
  }
  return trimmed;
}

export function safeResolveIanaTimeZone(raw?: string | null, fallback = DEFAULT_TZ): string {
  const trimmed = (raw ?? fallback).trim() || fallback;
  const dt = DateTime.now().setZone(trimmed);
  return dt.isValid ? trimmed : fallback;
}
