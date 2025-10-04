/**
 * Middleware Utilities for Netlify Functions
 * Centralized authentication and authorization helpers
 */

import type { HandlerEvent } from '@netlify/functions';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './auth';

/**
 * Standard API response format
 */
export interface ApiResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Extract and verify JWT token from request headers
 * Returns authentication status and payload if valid
 */
export function authenticateRequest(event: HandlerEvent): AuthResult {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      authenticated: false,
      error: 'No authorization token provided',
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
    };
  }

  return {
    authenticated: true,
    payload,
  };
}

/**
 * Require authentication for an endpoint
 * Returns error response if not authenticated, or payload if authenticated
 */
export function requireAuth(event: HandlerEvent): ApiResponse | JWTPayload {
  const authResult = authenticateRequest(event);

  if (!authResult.authenticated || !authResult.payload) {
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        error: authResult.error || 'Unauthorized',
      }),
    };
  }

  return authResult.payload;
}

/**
 * Optional authentication for endpoints that work with or without auth
 * Returns null if not authenticated, or payload if authenticated
 */
export function optionalAuth(event: HandlerEvent): JWTPayload | null {
  const authResult = authenticateRequest(event);
  return authResult.authenticated && authResult.payload ? authResult.payload : null;
}

/**
 * Standard error responses
 */
export const ErrorResponses = {
  unauthorized: (message = 'Unauthorized'): ApiResponse => ({
    statusCode: 401,
    body: JSON.stringify({ error: message }),
  }),

  forbidden: (message = 'You do not have permission to perform this action'): ApiResponse => ({
    statusCode: 403,
    body: JSON.stringify({ error: message }),
  }),

  notFound: (resource = 'Resource', message?: string): ApiResponse => ({
    statusCode: 404,
    body: JSON.stringify({ 
      error: message || `${resource} not found`,
    }),
  }),

  badRequest: (message = 'Bad request'): ApiResponse => ({
    statusCode: 400,
    body: JSON.stringify({ error: message }),
  }),

  methodNotAllowed: (allowedMethods: string[] = []): ApiResponse => ({
    statusCode: 405,
    headers: allowedMethods.length > 0 ? {
      'Allow': allowedMethods.join(', '),
    } : undefined,
    body: JSON.stringify({ error: 'Method not allowed' }),
  }),

  serverError: (message = 'Internal server error'): ApiResponse => ({
    statusCode: 500,
    body: JSON.stringify({ error: message }),
  }),
};

/**
 * Standard success response
 */
export function successResponse(data: any, message?: string): ApiResponse {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data,
      success: true,
      ...(message && { message }),
    }),
  };
}

/**
 * Standard created response
 */
export function createdResponse(data: any, message?: string): ApiResponse {
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data,
      success: true,
      ...(message && { message }),
    }),
  };
}

/**
 * Check HTTP method
 */
export function checkMethod(event: HandlerEvent, allowedMethods: string[]): ApiResponse | null {
  const method = event.httpMethod;
  if (!allowedMethods.includes(method)) {
    return ErrorResponses.methodNotAllowed(allowedMethods);
  }
  return null;
}

/**
 * Validate required query parameters
 */
export function validateQueryParams(
  event: HandlerEvent,
  requiredParams: string[]
): ApiResponse | null {
  const missing = requiredParams.filter(
    param => !event.queryStringParameters?.[param]
  );

  if (missing.length > 0) {
    return ErrorResponses.badRequest(
      `Missing required query parameters: ${missing.join(', ')}`
    );
  }

  return null;
}

/**
 * Validate required body fields
 */
export function validateBodyFields(
  body: any,
  requiredFields: string[]
): ApiResponse | null {
  const missing = requiredFields.filter(field => body[field] === undefined);

  if (missing.length > 0) {
    return ErrorResponses.badRequest(
      `Missing required fields: ${missing.join(', ')}`
    );
  }

  return null;
}
