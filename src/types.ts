/**
 * 결제 채널.
 * - ONLINE: 온라인 결제 (딥링크/QR). 결제창에 [결제하기][원격결제 요청] 노출
 * - OFFLINE: 오프라인 매장 (QR 스캔). 결제창에 [결제하기][더치페이하기] 노출
 *
 * ※ 어떤 버튼을 띄울지는 ErumPay 결제창이 이 값을 보고 결정한다.
 *    가맹점은 채널만 넘기면 되고, 더치페이/원격결제 UI를 만들 필요가 없다.
 */
export type Channel = 'ONLINE' | 'OFFLINE';

/** 결제 상태 (서버 payment_orders.payment_status 기준 단순화) */
export type PaymentStatus =
  | 'CREATED'
  | 'PAY_PENDING'
  | 'PG_PENDING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED';

/** 결제 요청 시 가맹점이 넘기는 정보 */
export interface PaymentRequest {
  /** 결제 금액 (원 단위, 정수) */
  amount: number;
  /** 주문명 (예: "아메리카노 외 1건") */
  orderName: string;
  /** 결제 채널 */
  channel: Channel;
  /** 결제 성공 시 돌아올 URL (온라인 결제용, 선택) */
  successUrl?: string;
  /** 결제 실패 시 돌아올 URL (온라인 결제용, 선택) */
  failUrl?: string;
}

/** 결제 요청 결과 — 이 URL/토큰으로 ErumPay 결제창에 진입한다 */
export interface PaymentRequestResult {
  /** 생성된 결제 ID */
  paymentId: string;
  /** 주문 번호 */
  orderNo: string;
  /** 결제창 진입 URL (QR 또는 딥링크) */
  redirectUrl: string;
  /** QR 토큰 (오프라인 결제 시 QR로 렌더링) */
  qrToken?: string;
}

/** 결제 상세 조회 결과 */
export interface Payment {
  paymentId: string;
  orderNo: string;
  orderName: string;
  amount: number;
  channel: Channel;
  status: PaymentStatus;
  /** 결제 완료 시각 (ISO 8601, PAID일 때만) */
  paidAt?: string;
}

/** 결제 취소 결과 */
export interface CancelResult {
  paymentId: string;
  status: PaymentStatus;
  canceledAt: string;
}
