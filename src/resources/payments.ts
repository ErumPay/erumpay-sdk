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

  // [be] 나영은 260529 1638 | 가맹점이 SDK로 결제 주문을 생성하고 ErumPay 결제창 진입 정보를 받는 메서드.
  request(params: PaymentRequest, options: RequestOptions = {}): Promise<PaymentRequestResult> {
    return this.client.request<PaymentRequestResult>('POST', '/api/v1/merchant/payments', {
      body: params,
      idempotent: true,
      idempotencyKey: options.idempotencyKey,
    });
  }

  // [be] 나영은 260529 1638 | 가맹점이 paymentId로 결제 상태를 재조회하는 메서드.
  get(paymentId: number | string): Promise<Payment> {
    return this.client.request<Payment>(
      'GET',
      `/api/v1/merchant/payments/${encodeURIComponent(String(paymentId))}`,
    );
  }

  // [be] 나영은 260529 1638 | 가맹점이 결제를 취소할 때 사용하는 메서드. 실제 취소 가능 여부는 서버 상태(PAID 등)가 판단한다.
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
