import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeStoredJson, type StoredValidator } from './storageCodec';

export { isArray, isRecord, isStringArray } from './storageCodec';
export type { StoredValidator } from './storageCodec';

/**
 * Safe JSON storage boundary.
 *
 * Corrupt or obsolete local JSON must never crash a screen. We deliberately
 * delete only the unusable key (never clear the whole app storage) and return
 * the caller's conservative fallback. Writes still throw so a persistence
 * failure is not silently reported as saved.
 */
export async function readStoredJson<T>(
  key: string,
  fallback: T,
  validator?: StoredValidator<T>,
): Promise<T> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(key);
  } catch {
    return fallback;
  }
  const decoded = decodeStoredJson(raw, fallback, validator);
  if (!decoded.valid) await removeBrokenKey(key);
  return decoded.value;
}

export async function writeStoredJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function writeStoredString(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function readStoredString<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw != null && allowed.includes(raw as T) ? (raw as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function removeStoredValue(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

async function removeBrokenKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Recovery must remain best-effort. Never replace a parse failure with a crash.
  }
}
