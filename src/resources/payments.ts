import type { ErumPayClient } from '../client';
import type {
  PaymentRequest,
  PaymentRequestResult,
  Payment,
  CancelResult,
} from '../types';

/**
 * 결제 관련 메서드 모음.
 * 가맹점이 실제로 호출하는 것만 노출한다.
 *
 * ※ 더치페이/원격결제/카드추천은 여기 없다.
 *    그건 ErumPay 결제창 "안에서" 사용자가 진행하는 기능이라,
 *    가맹점이 호출할 대상이 아니다. request()로 결제창을 띄우면
 *    그 안에서 채널에 맞게 자동으로 제공된다.
 */
export class PaymentsResource {
  constructor(private readonly client: ErumPayClient) {}

  /**
   * 결제를 생성하고 ErumPay 결제창 진입 정보를 받는다.
   * 이게 가맹점이 부르는 핵심 메서드.
   *
   * @example
   * const { redirectUrl } = await erumpay.payments.request({
   *   amount: 15000,
   *   orderName: '텀블러',
   *   channel: 'ONLINE',
   *   successUrl: 'https://myshop.com/success',
   * });
   * window.location.href = redirectUrl; // 결제창으로 이동
   */
  request(params: PaymentRequest): Promise<PaymentRequestResult> {
    return this.client.request<PaymentRequestResult>('POST', '/api/v1/payment/qr/request', {
      body: params,
      idempotent: true,
    });
  }

  /**
   * 결제 상세/상태를 조회한다.
   * 결제 완료 여부를 확인할 때 사용.
   */
  get(paymentId: string): Promise<Payment> {
    return this.client.request<Payment>('GET', `/api/v1/payment/${paymentId}`);
  }

  /**
   * 가맹점이 결제를 취소한다.
   */
  cancel(paymentId: string): Promise<CancelResult> {
    return this.client.request<CancelResult>(
      'POST',
      `/api/v1/payment/${paymentId}/merchant/cancel`,
      { idempotent: true },
    );
  }
}
