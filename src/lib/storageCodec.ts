export type StoredValidator<T> = (value: unknown) => value is T;

export function decodeStoredJson<T>(
  raw: string | null,
  fallback: T,
  validator?: StoredValidator<T>,
): { value: T; valid: boolean } {
  if (raw == null) return { value: fallback, valid: true };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (validator && !validator(parsed)) return { value: fallback, valid: false };
    return { value: parsed as T, valid: true };
  } catch {
    return { value: fallback, valid: false };
  }
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
