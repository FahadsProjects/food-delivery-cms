/**
 * Supported content value types
 */
export type ContentType = 'text' | 'image' | 'json';

/**
 * Raw DynamoDB item shape
 */
export interface ConfigItem {
  pk: string;
  sk: string;
  app: string;
  screen: string;
  key: string;
  value: string;
  type: ContentType;
  status: string;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Nested config structure grouped by screen
 * e.g. { auth: { key1: value1 }, home: { key2: value2 } }
 */
export type ConfigByScreen = Record<string, Record<string, unknown>>;

/**
 * Payload for creating/updating config
 */
export interface ConfigPayload {
  screen: string;
  key: string;
  value: string;
  type: ContentType;
}

/**
 * Valid app values for public config endpoint
 */
export const VALID_APPS = ['customer', 'driver', 'restaurant', 'admin'] as const;
export type ValidApp = (typeof VALID_APPS)[number];

/**
 * Max value size in bytes (10KB)
 */
export const MAX_VALUE_BYTES = 10 * 1024;
