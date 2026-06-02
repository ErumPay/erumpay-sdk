export type Channel = 'ONLINE' | 'OFFLINE';

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

export interface CancelResult {
  paymentId: number;
  status: PaymentStatus;
  canceledAt: string;
}
