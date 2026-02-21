import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { getConfig } from './handlers/getConfig.js';
import { createConfig } from './handlers/createConfig.js';
import { updateConfig } from './handlers/updateConfig.js';
import { deleteConfig } from './handlers/deleteConfig.js';
import { errorResponse } from './services/response.js';

type RouteMatcher = (event: APIGatewayProxyEvent) => boolean;
type RouteHandler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

interface Route {
  match: RouteMatcher;
  handle: RouteHandler;
}

const routes: Route[] = [
  {
    match: (e) => e.httpMethod === 'GET' && e.path === '/config',
    handle: getConfig,
  },
  {
    match: (e) => e.httpMethod === 'POST' && e.path === '/admin/config',
    handle: createConfig,
  },
  {
    match: (e) =>
      e.httpMethod === 'PUT' && /^\/admin\/config\/[^/]+$/.test(e.path ?? ''),
    handle: (e) => {
      const key = e.pathParameters?.key ?? e.path?.split('/').pop();
      return updateConfig({ ...e, pathParameters: { ...e.pathParameters, key } });
    },
  },
  {
    match: (e) =>
      e.httpMethod === 'DELETE' && /^\/admin\/config\/[^/]+$/.test(e.path ?? ''),
    handle: (e) => {
      const key = e.pathParameters?.key ?? e.path?.split('/').pop();
      return deleteConfig({ ...e, pathParameters: { ...e.pathParameters, key } });
    },
  },
];

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  for (const route of routes) {
    if (route.match(event)) {
      try {
        return await route.handle(event);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return errorResponse(500, message, 'HANDLER_ERROR');
      }
    }
  }

  return errorResponse(404, 'Not Found', 'NOT_FOUND');
};
