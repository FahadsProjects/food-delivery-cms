import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { putConfig } from '../services/dynamo.js';
import { ok, errorResponse } from '../services/response.js';
import { validateConfigPayload } from '../services/validation.js';
import type { ValidApp } from '../types/content.js';
import { VALID_APPS } from '../types/content.js';

type AuthorizerContext = {
  claims?: { sub?: string; role?: string; [key: string]: unknown };
  [key: string]: unknown;
};

function getAuthorizerUser(event: APIGatewayProxyEvent): { role?: string; sub?: string } | null {
  const authorizer = event.requestContext?.authorizer as AuthorizerContext | undefined;
  if (!authorizer?.claims) return null;
  const claims = authorizer.claims as Record<string, unknown>;
  return {
    role: claims.role as string | undefined,
    sub: claims.sub as string | undefined,
  };
}

/**
 * PUT /admin/config/{key} - Update config item (admin only)
 * Path: key - config key
 * Query: app, screen
 * Body: { value, type } (screen required for composite key)
 */
export async function updateConfig(
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

  if (!VALID_APPS.includes(app as ValidApp)) {
    return errorResponse(400, `App must be one of: ${VALID_APPS.join(', ')}`);
  }

  let body: unknown;
  try {
    body = event.body ? JSON.parse(event.body) : null;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const payload = validateConfigPayload({ ...(body as object), key, screen });
  if (!payload.valid || !payload.data) {
    return errorResponse(400, payload.error ?? 'Validation failed');
  }

  try {
    await putConfig(
      app,
      screen,
      key,
      payload.data.value,
      payload.data.type,
      user.sub ?? 'unknown'
    );
    return ok({ app, screen, key });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(500, message, 'CONFIG_UPDATE_ERROR');
  }
}
