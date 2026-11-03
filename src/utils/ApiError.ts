/** Operational error that is safe to expose to API clients. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', details?: unknown, code = 'BAD_REQUEST') {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }
  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }
  static notFound(what = 'Resource') {
    return new ApiError(404, 'NOT_FOUND', `${what} not found`);
  }
  static conflict(message: string, code = 'CONFLICT', details?: unknown) {
    return new ApiError(409, code, message, details);
  }
  static unprocessable(message: string, details?: unknown, code = 'UNPROCESSABLE') {
    return new ApiError(422, code, message, details);
  }
  static tooMany(message = 'Too many requests, please try again later') {
    return new ApiError(429, 'RATE_LIMITED', message);
  }
  static notImplemented(message: string) {
    return new ApiError(501, 'NOT_IMPLEMENTED', message);
  }
  static badGateway(message: string, code = 'UPSTREAM_ERROR') {
    return new ApiError(502, code, message);
  }
}
