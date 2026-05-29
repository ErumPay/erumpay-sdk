import { PaymentsResource } from './resources/payments';
import { ErumPayError } from './errors';

/** ErumPayClient 생성 시 넘기는 설정 */
export interface ErumPayConfig {
  /** 가맹점 API 키 (PG 어드민에서 발급) */
  apiKey: string;
  /** API 베이스 URL. 기본값은 운영 서버. 로컬 테스트 시 변경 */
  baseURL?: string;
}

/** request() 내부 옵션 */
interface RequestOptions {
  body?: unknown;
  /**
   * true면 Idempotency-Key를 자동 생성해서 헤더에 넣는다.
   * 결제 생성/취소처럼 중복 실행되면 안 되는 호출에 사용.
   */
  idempotent?: boolean;
}

/**
 * ErumPay SDK의 진입점.
 *
 * @example
 * const erumpay = new ErumPayClient({ apiKey: 'live_xxx' });
 * const result = await erumpay.payments.request({
 *   amount: 15000,
 *   orderName: '텀블러',
 *   channel: 'ONLINE',
 * });
 */
export class ErumPayClient {
  private readonly apiKey: string;
  private readonly baseURL: string;

  /** 결제 관련 메서드 모음 (request / get / cancel) */
  public readonly payments: PaymentsResource;

  constructor(config: ErumPayConfig) {
    if (!config.apiKey) {
      throw new Error('ErumPayClient: apiKey는 필수입니다.');
    }
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL ?? 'https://api.erumpay.com';
    this.payments = new PaymentsResource(this);
  }

  /**
   * 모든 HTTP 호출이 통과하는 단일 지점.
   * 인증 헤더, 멱등키, 에러 변환을 여기서 일괄 처리한다.
   *
   * resources/*.ts 에서 이 메서드를 호출한다.
   */
  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    // 중복 결제 방지: 외부 개발자가 빠뜨려도 SDK가 자동으로 채워줌
    if (opts.idempotent) {
      headers['Idempotency-Key'] = crypto.randomUUID();
    }

    const res = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    if (!res.ok) {
      // 서버가 { code, message } 형태로 에러를 준다고 가정. 실패해도 안전하게 폴백
      const err = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };
      throw new ErumPayError(
        res.status,
        err.code ?? 'UNKNOWN',
        err.message ?? res.statusText,
      );
    }

    // 204 No Content 등 본문이 없는 응답 방어
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
