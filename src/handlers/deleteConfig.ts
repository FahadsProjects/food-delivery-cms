import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteConfig as deleteConfigItem } from '../services/dynamo.js';
import { noContent, errorResponse } from '../services/response.js';
import { validateKey, validateScreen } from '../services/validation.js';
import type { ValidApp } from '../types/content.js';
import { VALID_APPS } from '../types/content.js';

type AuthorizerContext = {
  claims?: { sub?: string; role?: string; [key: string]: unknown };
  [key: string]: unknown;
};

function getAuthorizerUser(event: APIGatewayProxyEvent): { role?: string } | null {
  const authorizer = event.requestContext?.authorizer as AuthorizerContext | undefined;
  if (!authorizer?.claims) return null;
  const claims = authorizer.claims as Record<string, unknown>;
  return { role: claims.role as string | undefined };
}

/**
 * DELETE /admin/config/{key} - Delete config item (admin only)
 * Path: key - config key
 * Query: app, screen
 */
export async function deleteConfig(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const user = getAuthorizerUser(event);
  if (!user || user.role !== 'admin') {
    return errorResponse(403, 'Forbidden: admin role required', 'FORBIDDEN');
  }

  const key = event.pathParameters?.key;
  const app = event.queryStringParameters?.app;
  const screen = event.queryStringParameters?.screen;

  if (!key || !app || !screen) {
    return errorResponse(400, 'Missing required: key (path), app (query), screen (query)');
  }

  const keyValidation = validateKey(key);
  if (!keyValidation.valid) {
    return errorResponse(400, keyValidation.error ?? 'Invalid key');
  }

  const screenValidation = validateScreen(screen);
  if (!screenValidation.valid) {
    return errorResponse(400, screenValidation.error ?? 'Invalid screen');
  }

  if (!VALID_APPS.includes(app as ValidApp)) {
    return errorResponse(400, `App must be one of: ${VALID_APPS.join(', ')}`);
  }

  try {
    await deleteConfigItem(app, screen, key);
    return noContent();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(500, message, 'CONFIG_DELETE_ERROR');
  }
}
