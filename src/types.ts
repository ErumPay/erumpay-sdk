export type Channel = 'ONLINE' | 'OFFLINE';

// [be] 나영은 260529 1638 | 서버 payment_orders.payment_status와 SDK 공개 타입을 맞춘다.
export type PaymentStatus =
  | 'CREATED'
  | 'PAY_PENDING'
  | 'PG_PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'AUTHORIZED'
  | 'VOIDED'
  | 'CANCELED';

export interface PaymentRequest {
  /** Payment amount in KRW. */
  amount: number;
  /** Merchant-facing order name. */
  orderName: string;
  /** Payment channel shown in the ErumPay checkout. */
  channel: Channel;
  /** Redirect target after successful online checkout. */
  successUrl?: string;
  /** Redirect target after failed online checkout. */
  failUrl?: string;
}

// [be] 나영은 260529 1638 | 결제 생성 응답은 결제 주문 정보와 결제창 진입 정보를 함께 제공한다.
export interface PaymentRequestResult {
  paymentId: number;
  orderNo: string;
  orderName: string;
  amount: number;
  channel: Channel;
  status: PaymentStatus;
  redirectUrl: string;
  qrToken?: string;
  paidAt?: string;
}

// [be] 나영은 260529 1638 | 결제 조회 응답 타입. 생성 응답과 달리 redirectUrl/qrToken은 상황에 따라 없을 수 있다.
export interface Payment {
  paymentId: number;
  orderNo: string;
  orderName: string;
  amount: number;
  channel: Channel;
  status: PaymentStatus;
  redirectUrl?: string;
  qrToken?: string;
  paidAt?: string;
}

// [be] 나영은 260529 1638 | 결제 취소 응답 타입. 서버의 merchant cancel 응답 계약과 맞춘다.
export interface CancelResult {
  paymentId: number;
  status: PaymentStatus;
  canceledAt: string;
}
