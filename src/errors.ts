/**
 * ErumPay SDK에서 발생하는 모든 에러의 기본 클래스.
 *
 * 외부 팀은 try/catch로 이걸 잡아서 status/code로 분기할 수 있다.
 *
 * @example
 * try {
 *   await erumpay.payments.request({ ... });
 * } catch (e) {
 *   if (e instanceof ErumPayError && e.status === 409) {
 *     // 중복 결제 등 처리
 *   }
 * }
 */
export class ErumPayError extends Error {
  /** HTTP 상태 코드 (예: 400, 401, 409, 500) */
  public readonly status: number;
  /** 서버가 내려준 에러 코드 (예: 'DUPLICATE_PAYMENT') */
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ErumPayError';
    this.status = status;
    this.code = code;
    // TypeScript에서 Error 상속 시 prototype 체인 복원 (instanceof 정상 동작)
    Object.setPrototypeOf(this, ErumPayError.prototype);
  }
}
