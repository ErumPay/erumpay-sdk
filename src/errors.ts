export type ErrorDetails = Record<string, unknown> | Array<Record<string, unknown>>;

export class ErumPayError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly correlationId?: string;
  public readonly details?: ErrorDetails;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    correlationId?: string;
    details?: ErrorDetails;
  }) {
    const { status, code, message, requestId, correlationId, details } = params;
    super(message);
    this.name = 'ErumPayError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.correlationId = correlationId;
    this.details = details;
    Object.setPrototypeOf(this, ErumPayError.prototype);
  }
}
