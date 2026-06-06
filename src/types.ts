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

export type TerminalPaymentStatus = 'PAID' | 'FAILED' | 'EXPIRED' | 'VOIDED' | 'CANCELED';

export interface PaymentRequest {
  /** Payment amount in KRW. Must be a positive integer. */
  amount: number;
  /** Merchant-facing order name shown in dashboards and checkout screens. */
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

export interface WaitForPaymentOptions {
  /** Polling interval in milliseconds. Defaults to 1000. */
  intervalMs?: number;
  /** Maximum wait time in milliseconds. Defaults to 60000. */
  timeoutMs?: number;
  /** Statuses that should stop polling. Defaults to all terminal statuses. */
  terminalStatuses?: readonly PaymentStatus[];
}

export const DEFAULT_TERMINAL_PAYMENT_STATUSES: readonly TerminalPaymentStatus[] = [
  'PAID',
  'FAILED',
  'EXPIRED',
  'VOIDED',
  'CANCELED',
];

export function isTerminalPaymentStatus(status: PaymentStatus): status is TerminalPaymentStatus {
  return DEFAULT_TERMINAL_PAYMENT_STATUSES.includes(status as TerminalPaymentStatus);
}
