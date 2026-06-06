export type ErrorDetails = Record<string, unknown> | Array<Record<string, unknown>> | unknown;

export interface ErumPayErrorPayload {
  status?: number;
  error?: string;
  code?: string;
  message?: string;
  requestId?: string;
  correlationId?: string;
  details?: ErrorDetails;
}

export interface ErumPayErrorParams {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  correlationId?: string;
  details?: ErrorDetails;
  raw?: ErumPayErrorPayload;
}

/**
 * ErumPay API가 2xx가 아닌 응답을 반환했을 때 발생하는 SDK 에러입니다.
 *
 * 가맹점 서버에서는 `message`보다 `code` 기준으로 분기하고, 운영 문의에는
 * `requestId` 또는 `correlationId`를 함께 남기는 것을 권장합니다.
 */
export class ErumPayError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId?: string;
  public readonly correlationId?: string;
  public readonly details?: ErrorDetails;
  public readonly raw?: ErumPayErrorPayload;

  constructor(params: ErumPayErrorParams) {
    const { status, code, message, requestId, correlationId, details, raw } = params;
    super(message);
    this.name = 'ErumPayError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.correlationId = correlationId;
    this.details = details;
    this.raw = raw;
    Object.setPrototypeOf(this, ErumPayError.prototype);
  }
}

/**
 * HTTP 응답을 받기 전에 실패했거나, 성공 응답을 SDK가 해석할 수 없을 때 발생합니다.
 *
 * 예: 네트워크 오류, 타임아웃, 성공 응답의 JSON 파싱 실패.
 */
export class ErumPayConnectionError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ErumPayConnectionError';
    this.cause = cause;
    Object.setPrototypeOf(this, ErumPayConnectionError.prototype);
  }
}
