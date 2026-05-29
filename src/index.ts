// 외부 팀이 import할 수 있는 것들의 입구.
// 여기서 export한 것만 패키지 밖에서 사용 가능하다.

export { ErumPayClient } from './client';
export type { ErumPayConfig } from './client';

export { ErumPayError } from './errors';

export type {
  Channel,
  PaymentStatus,
  PaymentRequest,
  PaymentRequestResult,
  Payment,
  CancelResult,
} from './types';
