import type { ContentType } from '../types/content.js';
import { MAX_VALUE_BYTES, VALID_APPS } from '../types/content.js';

const KEY_PATTERN = /^[a-z0-9_]+$/;
const SCREEN_PATTERN = /^[a-z0-9_]+$/;
const VALID_TYPES: ContentType[] = ['text', 'image', 'json'];

/**
 * Validate app query parameter
 */
export function validateApp(app: string | null | undefined): { valid: boolean; error?: string } {
  if (!app || typeof app !== 'string') {
    return { valid: false, error: 'Missing required query parameter: app' };
  }
  if (!VALID_APPS.includes(app as (typeof VALID_APPS)[number])) {
    return {
      valid: false,
      error: `Invalid app. Must be one of: ${VALID_APPS.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate key format
 */
export function validateKey(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key is required' };
  }
  if (!KEY_PATTERN.test(key)) {
    return { valid: false, error: 'Key must match /^[a-z0-9_]+$/' };
  }
  return { valid: true };
}

/**
 * Validate screen format
 */
export function validateScreen(screen: string): { valid: boolean; error?: string } {
  if (!screen || typeof screen !== 'string') {
    return { valid: false, error: 'Screen is required' };
  }
  if (!SCREEN_PATTERN.test(screen)) {
    return { valid: false, error: 'Screen must match /^[a-z0-9_]+$/' };
  }
  return { valid: true };
}

/**
 * Validate value size (must be < 10KB)
 */
export function validateValueSize(value: string): { valid: boolean; error?: string } {
  const bytes = new TextEncoder().encode(value).length;
  if (bytes >= MAX_VALUE_BYTES) {
    return {
      valid: false,
      error: `Value exceeds maximum size of ${MAX_VALUE_BYTES / 1024}KB`,
    };
  }
  return { valid: true };
}

/**
 * Validate content type
 */
export function validateType(type: unknown): { valid: boolean; error?: string } {
  if (!type || typeof type !== 'string') {
    return { valid: false, error: 'Type is required' };
  }
  if (!VALID_TYPES.includes(type as ContentType)) {
    return {
      valid: false,
      error: `Type must be one of: ${VALID_TYPES.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate full config payload (for create/update)
 */
export function validateConfigPayload(payload: unknown): {
  valid: boolean;
  error?: string;
  data?: { screen: string; key: string; value: string; type: ContentType };
} {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const obj = payload as Record<string, unknown>;
  const screen = obj.screen;
  const key = obj.key;
  const value = obj.value;
  const type = obj.type;

  const screenResult = validateScreen(String(screen ?? ''));
  if (!screenResult.valid) return screenResult;

  const keyResult = validateKey(String(key ?? ''));
  if (!keyResult.valid) return keyResult;

  const valueStr = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const valueSizeResult = validateValueSize(valueStr);
  if (!valueSizeResult.valid) return valueSizeResult;

  const typeResult = validateType(type);
  if (!typeResult.valid) return typeResult;

  return {
    valid: true,
    data: {
      screen: String(screen),
      key: String(key),
      value: valueStr,
      type: type as ContentType,
    },
  };
}
