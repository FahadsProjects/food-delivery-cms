import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getConfig as fetchConfig } from '../services/dynamo.js';
import { ok, errorResponse } from '../services/response.js';
import { validateApp } from '../services/validation.js';

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=300' };

/**
 * GET /config - Public config endpoint
 * Query: app=customer|driver|restaurant|admin
 */
export async function getConfig(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const app = event.queryStringParameters?.app ?? null;

  const validation = validateApp(app);
  if (!validation.valid) {
    return errorResponse(400, validation.error ?? 'Invalid request');
  }

  try {
    const config = await fetchConfig(app as string);
    return ok(config, CACHE_HEADERS);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(500, message, 'CONFIG_FETCH_ERROR');
  }
}
