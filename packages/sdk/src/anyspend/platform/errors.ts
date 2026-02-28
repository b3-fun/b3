/**
 * Typed error classes for the AnySpend Platform API client.
 */

export interface ApiErrorResponse {
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
}

export class ApiError extends Error {
  readonly type: string;
  readonly code: string;
  readonly status: number;
  readonly param?: string;

  constructor(status: number, body: ApiErrorResponse) {
    super(body.error.message);
    this.name = "ApiError";
    this.type = body.error.type;
    this.code = body.error.code;
    this.status = status;
    this.param = body.error.param;
  }
}

export class AuthenticationError extends ApiError {
  constructor(status: number, body: ApiErrorResponse) {
    super(status, body);
    this.name = "AuthenticationError";
  }
}

export class PermissionError extends ApiError {
  constructor(status: number, body: ApiErrorResponse) {
    super(status, body);
    this.name = "PermissionError";
  }
}

export class RateLimitError extends ApiError {
  readonly retryAfter: number;

  constructor(status: number, body: ApiErrorResponse, retryAfter: number) {
    super(status, body);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class NotFoundError extends ApiError {
  constructor(status: number, body: ApiErrorResponse) {
    super(status, body);
    this.name = "NotFoundError";
  }
}

export class IdempotencyError extends ApiError {
  constructor(status: number, body: ApiErrorResponse) {
    super(status, body);
    this.name = "IdempotencyError";
  }
}

/**
 * Parse an API error response into the appropriate typed error class.
 */
export function parseApiError(status: number, body: ApiErrorResponse, headers?: Headers): ApiError {
  const type = body.error?.type;

  if (status === 401 || type === "authentication_error") {
    return new AuthenticationError(status, body);
  }
  if (status === 403 || type === "permission_error") {
    return new PermissionError(status, body);
  }
  if (status === 429 || type === "rate_limit_error") {
    const retryAfter = parseInt(headers?.get("Retry-After") || "60", 10);
    return new RateLimitError(status, body, retryAfter);
  }
  if (status === 404 || type === "not_found_error") {
    return new NotFoundError(status, body);
  }
  if (type === "idempotency_error") {
    return new IdempotencyError(status, body);
  }

  return new ApiError(status, body);
}
