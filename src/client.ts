import { PaymentsResource } from './resources/payments';
import { ErumPayConnectionError, ErumPayError, type ErumPayErrorPayload } from './errors';

export interface ErumPayConfig {
  /** ErumPay가 발급한 가맹점 API Key입니다. 반드시 가맹점 서버에만 보관하세요. */
  apiKey: string;
  /** API Gateway 또는 payment-service base URL입니다. 기본값은 운영 API 주소입니다. */
  baseURL?: string;
  /** 요청별 타임아웃(ms)입니다. 기본값은 30000입니다. */
  timeoutMs?: number;
  /** 재시도 가능한 실패에 대한 자동 재시도 횟수입니다. 기본값은 1입니다. */
  maxRetries?: number;
  /** 테스트 또는 특수 런타임에서 사용할 custom fetch 구현입니다. */
  fetch?: typeof fetch;
}

interface RequestOptions {
  body?: unknown;
  idempotent?: boolean;
  idempotencyKey?: string;
}

const DEFAULT_BASE_URL = 'https://api.erumpay.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 1;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class ErumPayClient {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;

  public readonly payments: PaymentsResource;

  constructor(config: ErumPayConfig) {
    if (!config.apiKey) {
      throw new Error('ErumPayClient: apiKey is required');
    }

    this.apiKey = config.apiKey;
    this.baseURL = (config.baseURL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchImpl = config.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new Error('ErumPayClient: fetch is required in this runtime');
    }

    this.payments = new PaymentsResource(this);
  }

  /**
   * 모든 리소스가 공유하는 HTTP 진입점입니다.
   *
   * 인증, JSON 직렬화, 멱등키, 타임아웃, 재시도, SDK 에러 변환을 한 곳에서 처리합니다.
   */
  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const idempotencyKey = opts.idempotent ? opts.idempotencyKey ?? createIdempotencyKey() : undefined;
    const shouldRetry = method.toUpperCase() === 'GET' || Boolean(opts.idempotent);
    const attempts = shouldRetry ? this.maxRetries + 1 : 1;

    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.requestOnce<T>(method, path, opts.body, idempotencyKey);
      } catch (error) {
        lastError = error;
        if (attempt >= attempts - 1 || !isRetryableError(error)) {
          throw error;
        }
        await sleep(backoffDelayMs(attempt));
      }
    }

    throw lastError;
  }

  private async requestOnce<T>(method: string, path: string, body: unknown, idempotencyKey?: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': '@erumpay/sdk/1.0.0',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseURL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      const message = controller.signal.aborted
        ? `ErumPay request timed out after ${this.timeoutMs}ms`
        : 'ErumPay request failed before receiving a response';
      throw new ErumPayConnectionError(message, error);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw await toErumPayError(response);
    }

    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new ErumPayConnectionError('ErumPay returned invalid JSON', error);
    }
  }
}

async function toErumPayError(response: Response): Promise<ErumPayError> {
  const payload = (await response.json().catch(() => ({}))) as ErumPayErrorPayload;
  return new ErumPayError({
    status: response.status,
    code: payload.code ?? 'UNKNOWN',
    message: payload.message ?? response.statusText,
    requestId: payload.requestId ?? response.headers.get('x-request-id') ?? undefined,
    correlationId: payload.correlationId ?? response.headers.get('x-correlation-id') ?? undefined,
    details: payload.details,
    raw: payload,
  });
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ErumPayConnectionError) {
    return true;
  }
  if (error instanceof ErumPayError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  return false;
}

function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function backoffDelayMs(attempt: number): number {
  return Math.min(100 * 2 ** attempt, 1_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
