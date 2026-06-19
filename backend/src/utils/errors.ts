/**
 * Canonical error codes. The HTTP layer turns AppError into the
 * spec's error shape: { error: CODE, message: "..." }.
 */
export type ErrorCode =
  // auth
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'TOO_MANY_ATTEMPTS'
  | 'TOO_MANY_REQUESTS'
  | 'USER_BLOCKED'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'GOOGLE_AUTH_FAILED'
  // users
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ADDRESS_LIMIT_REACHED'
  | 'ADDRESS_IN_USE'
  | 'INSUFFICIENT_CREDITS'
  | 'PHONE_CHANGE_UNSUPPORTED'
  // generic
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  code: ErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ErrorCode, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Convenience factories for the most common cases.
export const Errors = {
  otpExpired: () => new AppError('OTP_EXPIRED', 'OTP expired, request a new one.', 410),
  otpInvalid: () => new AppError('OTP_INVALID', 'The OTP you entered is incorrect.', 400),
  tooManyAttempts: () =>
    new AppError('TOO_MANY_ATTEMPTS', 'Too many wrong attempts. Try again later.', 429),
  tooManyRequests: () =>
    new AppError('TOO_MANY_REQUESTS', 'Too many OTP requests. Try again later.', 429),
  userBlocked: (minutes: number) =>
    new AppError('USER_BLOCKED', `Account temporarily locked. Try again in ${minutes} minutes.`, 423),
  unauthorized: (msg = 'Authentication required.') => new AppError('UNAUTHORIZED', msg, 401),
  invalidToken: (msg = 'Invalid or revoked token.') => new AppError('INVALID_TOKEN', msg, 401),
  tokenExpired: () => new AppError('TOKEN_EXPIRED', 'Access token expired.', 401),
  forbidden: (msg = 'You do not have permission to perform this action.') =>
    new AppError('FORBIDDEN', msg, 403),
  notFound: (msg = 'Resource not found.') => new AppError('NOT_FOUND', msg, 404),
  validation: (msg: string, details?: unknown) =>
    new AppError('VALIDATION_ERROR', msg, 422, details),
  addressLimit: () =>
    new AppError('ADDRESS_LIMIT_REACHED', 'You can save at most 10 addresses.', 409),
  addressInUse: () =>
    new AppError('ADDRESS_IN_USE', 'This address is linked to a pending order and cannot be deleted.', 409),
  insufficientCredits: () =>
    new AppError('INSUFFICIENT_CREDITS', 'Not enough credits for this redemption.', 422),
  phoneChange: () =>
    new AppError('PHONE_CHANGE_UNSUPPORTED', 'Phone number changes are not supported. Please contact support.', 400),
  googleAuthFailed: () =>
    new AppError('GOOGLE_AUTH_FAILED', 'Could not verify Google sign-in.', 401),
};
