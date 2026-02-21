import type { APIGatewayProxyResult } from 'aws-lambda';

interface JsonResponseOptions {
  headers?: Record<string, string>;
}

/**
 * Structured JSON response helper
 */
export function jsonResponse(
  statusCode: number,
  body: unknown,
  options: JsonResponseOptions = {}
): APIGatewayProxyResult {
  const { headers = {} } = options;
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : '',
  };
}

/**
 * Success response (200)
 */
export function ok<T>(data: T, headers?: Record<string, string>): APIGatewayProxyResult {
  return jsonResponse(200, { success: true, data }, { headers });
}

/**
 * Created response (201)
 */
export function created<T>(data: T): APIGatewayProxyResult {
  return jsonResponse(201, { success: true, data });
}

/**
 * No content (204) - used for DELETE
 */
export function noContent(headers?: Record<string, string>): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: '',
  };
}

/**
 * Error response with consistent shape
 */
export function errorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown
): APIGatewayProxyResult {
  const body: Record<string, unknown> = {
    success: false,
    error: { message, code },
  };
  if (details !== undefined) body.details = details;
  return jsonResponse(statusCode, body);
}
