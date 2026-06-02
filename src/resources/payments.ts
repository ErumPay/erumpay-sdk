import type { ErumPayClient } from '../client';
import type {
  CancelResult,
  Payment,
  PaymentRequest,
  PaymentRequestResult,
} from '../types';

export interface RequestOptions {
  idempotencyKey?: string;
}

export class PaymentsResource {
  constructor(private readonly client: ErumPayClient) {}

  request(params: PaymentRequest, options: RequestOptions = {}): Promise<PaymentRequestResult> {
    return this.client.request<PaymentRequestResult>('POST', '/api/v1/merchant/payments', {
      body: params,
      idempotent: true,
      idempotencyKey: options.idempotencyKey,
    });
  }

  get(paymentId: number | string): Promise<Payment> {
    return this.client.request<Payment>(
      'GET',
      `/api/v1/merchant/payments/${encodeURIComponent(String(paymentId))}`,
    );
  }

  cancel(paymentId: number | string, options: RequestOptions = {}): Promise<CancelResult> {
    return this.client.request<CancelResult>(
      'POST',
      `/api/v1/merchant/payments/${encodeURIComponent(String(paymentId))}/cancel`,
      {
        idempotent: true,
        idempotencyKey: options.idempotencyKey,
      },
    );
  }
}
