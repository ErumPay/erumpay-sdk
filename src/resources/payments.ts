import type { ErumPayClient } from '../client';
import type {
  CancelResult,
  Payment,
  PaymentRequest,
  PaymentRequestResult,
  PaymentStatus,
  WaitForPaymentOptions,
} from '../types';
import { DEFAULT_TERMINAL_PAYMENT_STATUSES } from '../types';

export interface RequestOptions {
  /** 결제 생성/취소 재시도를 안전하게 만들기 위한 안정적인 key입니다. 주문번호 기반을 권장합니다. */
  idempotencyKey?: string;
}

export class PaymentsResource {
  constructor(private readonly client: ErumPayClient) {}

  /**
   * 가맹점 결제를 생성하고 ErumPay 결제창 진입 정보를 반환합니다.
   *
   * API Key를 사용하므로 가맹점 서버에서만 호출해야 합니다. 브라우저나 모바일 앱 번들에서
   * 직접 호출하면 안 됩니다.
   */
  request(params: PaymentRequest, options: RequestOptions = {}): Promise<PaymentRequestResult> {
    return this.client.request<PaymentRequestResult>('POST', '/api/v1/merchant/payments', {
      body: params,
      idempotent: true,
      idempotencyKey: options.idempotencyKey,
    });
  }

  /** 가맹점 소유 결제를 paymentId로 조회합니다. */
  get(paymentId: number | string): Promise<Payment> {
    return this.client.request<Payment>(
      'GET',
      `/api/v1/merchant/payments/${encodeURIComponent(String(paymentId))}`,
    );
  }

  /**
   * 결제 완료된 가맹점 결제를 취소합니다.
   *
   * 이미 취소된 결제는 서버에서 멱등 성공 응답으로 반환될 수 있습니다. 결제 완료 전 상태는
   * `PAYMENT_CANCEL_NOT_ALLOWED` 계열 에러가 발생할 수 있습니다.
   */
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

  /**
   * 결제가 지정한 종료 상태에 도달할 때까지 짧게 polling합니다.
   *
   * 운영 주문 확정은 웹훅 기반을 권장하지만, SDK 테스트/로컬 데모/관리자 도구에서는
   * 짧은 polling helper가 유용합니다.
   */
  async waitForStatus(paymentId: number | string, options: WaitForPaymentOptions = {}): Promise<Payment> {
    const intervalMs = options.intervalMs ?? 1_000;
    const timeoutMs = options.timeoutMs ?? 60_000;
    const terminalStatuses = new Set<PaymentStatus>(
      options.terminalStatuses ?? DEFAULT_TERMINAL_PAYMENT_STATUSES,
    );
    const deadline = Date.now() + timeoutMs;

    while (true) {
      const payment = await this.get(paymentId);
      if (terminalStatuses.has(payment.status)) {
        return payment;
      }
      if (Date.now() >= deadline) {
        throw new Error(`Timed out waiting for payment ${paymentId} status`);
      }
      await sleep(intervalMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
