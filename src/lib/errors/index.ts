export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryable = retryable;
  }
}

export class AIProviderError extends AppError {
  public readonly provider: string;

  constructor(
    message: string,
    provider: string,
    statusCode: number = 502,
    retryable: boolean = false
  ) {
    super(message, statusCode, 'AI_PROVIDER_ERROR', retryable);
    this.name = 'AIProviderError';
    this.provider = provider;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      429,
      'RATE_LIMIT_EXCEEDED',
      true
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class TokenLimitError extends AppError {
  public readonly tokensUsed: number;
  public readonly maxTokens: number;

  constructor(tokensUsed: number, maxTokens: number) {
    super(
      `Token limit exceeded: ${tokensUsed} used, max ${maxTokens}`,
      400,
      'TOKEN_LIMIT_EXCEEDED',
      false
    );
    this.name = 'TokenLimitError';
    this.tokensUsed = tokensUsed;
    this.maxTokens = maxTokens;
  }
}

export class InsufficientPlanError extends AppError {
  public readonly requiredPlan: string;
  public readonly currentPlan: string;

  constructor(requiredPlan: string, currentPlan: string) {
    super(
      `This feature requires the ${requiredPlan} plan. You are on the ${currentPlan} plan.`,
      403,
      'INSUFFICIENT_PLAN',
      false
    );
    this.name = 'InsufficientPlanError';
    this.requiredPlan = requiredPlan;
    this.currentPlan = currentPlan;
  }
}

export class ToolExecutionError extends AppError {
  public readonly toolName: string;
  public readonly reason: string;

  constructor(toolName: string, reason: string) {
    super(
      `Tool "${toolName}" failed: ${reason}`,
      500,
      'TOOL_EXECUTION_ERROR',
      false
    );
    this.name = 'ToolExecutionError';
    this.toolName = toolName;
    this.reason = reason;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED', false);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message, 400, 'VALIDATION_ERROR', false);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

export function formatErrorResponse(error: unknown): {
  error: string;
  code: string;
  statusCode: number;
  retryable: boolean;
  details?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      details: error instanceof ValidationError ? { fields: error.fields } : undefined,
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      retryable: false,
    };
  }

  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    retryable: false,
  };
}
