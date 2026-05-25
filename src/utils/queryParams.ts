export function clampInt(value: unknown, defaultValue: number, min: number, max: number): number {
  const parsed = Number(value ?? defaultValue);

  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export function truncateString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

export function optionalClampInt(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}
