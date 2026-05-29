import { PaymentsResource } from './resources/payments';
import { ErumPayError } from './errors';

export interface ErumPayConfig {
  /** Merchant API key issued by ErumPay. */
  apiKey: string;
  /** API base URL. Defaults to the production endpoint. */
  baseURL?: string;
}

interface RequestOptions {
  body?: unknown;
  idempotent?: boolean;
  idempotencyKey?: string;
}

export class ErumPayClient {
  private readonly apiKey: string;
  private readonly baseURL: string;

  public readonly payments: PaymentsResource;

  constructor(config: ErumPayConfig) {
    if (!config.apiKey) {
      throw new Error('ErumPayClient: apiKey is required');
    }
    this.apiKey = config.apiKey;
    this.baseURL = (config.baseURL ?? 'https://api.erumpay.com').replace(/\/+$/, '');
    this.payments = new PaymentsResource(this);
  }

  // [be] 나영은 260529 1638 | SDK 모든 HTTP 호출의 공통 진입점. 인증/멱등키/에러 변환을 한 곳에서 처리한다.
  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    // [be] 나영은 260529 1638 | 결제 생성/취소는 중복 요청 방지를 위해 Idempotency-Key를 자동 또는 명시값으로 보낸다.
    if (opts.idempotent) {
      headers['Idempotency-Key'] = opts.idempotencyKey ?? crypto.randomUUID();
    }

    const res = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };
      throw new ErumPayError(
        res.status,
        err.code ?? 'UNKNOWN',
        err.message ?? res.statusText,
      );
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
