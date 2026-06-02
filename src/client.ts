import { PaymentsResource } from './resources/payments';
import { ErumPayError, type ErrorDetails } from './errors';

export interface ErumPayConfig {
  /** Merchant API key issued by ErumPay. Keep this on the merchant server. */
  apiKey: string;
  /** API Gateway or payment-service base URL. Defaults to the production endpoint. */
  baseURL?: string;
}

interface RequestOptions {
  body?: unknown;
  idempotent?: boolean;
  idempotencyKey?: string;
}

interface ErrorPayload {
  code?: string;
  message?: string;
  requestId?: string;
  correlationId?: string;
  details?: ErrorDetails;
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

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (opts.idempotent) {
      headers['Idempotency-Key'] = opts.idempotencyKey ?? crypto.randomUUID();
    }

    const res = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as ErrorPayload;
      throw new ErumPayError({
        status: res.status,
        code: err.code ?? 'UNKNOWN',
        message: err.message ?? res.statusText,
        requestId: err.requestId,
        correlationId: err.correlationId,
        details: err.details,
      });
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
