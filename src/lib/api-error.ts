import { NextResponse } from "next/server";

/**
 * Standard error codes and messages for API responses
 */
export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  CONFLICT: "CONFLICT",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

/**
 * Error response structure
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiError = {
  badRequest: (message = "Bad request", details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCodes.BAD_REQUEST, message, 400, details),

  unauthorized: (message = "Unauthorized") =>
    createErrorResponse(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = "Forbidden") => createErrorResponse(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (message = "Resource not found") =>
    createErrorResponse(ErrorCodes.NOT_FOUND, message, 404),

  methodNotAllowed: (message = "Method not allowed") =>
    createErrorResponse(ErrorCodes.METHOD_NOT_ALLOWED, message, 405),

  conflict: (message = "Resource conflict", details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCodes.CONFLICT, message, 409, details),

  unprocessableEntity: (message = "Unprocessable entity", details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCodes.UNPROCESSABLE_ENTITY, message, 422, details),

  tooManyRequests: (message = "Too many requests") =>
    createErrorResponse(ErrorCodes.TOO_MANY_REQUESTS, message, 429),

  internalServerError: (message = "Internal server error") =>
    createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, message, 500),
};
