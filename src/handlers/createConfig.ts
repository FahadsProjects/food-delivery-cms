import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { putConfig } from '../services/dynamo.js';
import { created, errorResponse } from '../services/response.js';
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
 * POST /admin/config - Create config item (admin only)
 * Body: { app, screen, key, value, type }
 */
export async function createConfig(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const user = getAuthorizerUser(event);
  if (!user || user.role !== 'admin') {
    return errorResponse(403, 'Forbidden: admin role required', 'FORBIDDEN');
  }

  let body: unknown;
  try {
    body = event.body ? JSON.parse(event.body) : null;
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }

  const payload = validateConfigPayload(body);
  if (!payload.valid || !payload.data) {
    return errorResponse(400, payload.error ?? 'Validation failed');
  }

  const app = (body as Record<string, unknown>).app;
  if (!app || typeof app !== 'string' || !VALID_APPS.includes(app as ValidApp)) {
    return errorResponse(400, `App must be one of: ${VALID_APPS.join(', ')}`);
  }

  try {
    await putConfig(
      app,
      payload.data.screen,
      payload.data.key,
      payload.data.value,
      payload.data.type,
      user.sub ?? 'unknown'
    );
    return created({
      app,
      screen: payload.data.screen,
      key: payload.data.key,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(500, message, 'CONFIG_CREATE_ERROR');
  }
}
