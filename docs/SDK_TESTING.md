# ErumPay SDK 테스트 가이드

SDK v1은 아래 세 단계로 테스트합니다.

## 1. 단위 테스트

커밋 전 항상 실행합니다.

```bash
npm run typecheck
npm test
```

현재 단위 테스트가 확인하는 내용:

- API Key 누락 검증
- `Authorization`, `Idempotency-Key` 헤더 설정
- 결제 생성/조회/취소 요청 path
- 서버 에러를 `ErumPayError`로 변환
- 네트워크 실패를 `ErumPayConnectionError`로 변환
- 재시도 시 같은 멱등키 유지
- `payments.waitForStatus()` polling 동작

## 2. 빌드 테스트

```bash
npm run build
```

아래 파일이 생성되는지 확인합니다.

```text
dist/index.js
dist/index.cjs
dist/index.d.ts
dist/index.d.cts
```

이 테스트는 ESM, CommonJS, TypeScript declaration이 모두 정상 배포되는지 확인합니다.

## 3. 로컬 결제 플로우 테스트

`payment-service`와 결제 플로우에 필요한 로컬 서비스를 실행합니다.

```env
ERUMPAY_API_KEY=test_1_local
ERUMPAY_BASE_URL=http://localhost:8083
```

가맹점 서버 역할을 하는 작은 스크립트를 만듭니다.

```typescript
import { ErumPayClient } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
  baseURL: process.env.ERUMPAY_BASE_URL!,
});

const created = await erumpay.payments.request(
  {
    amount: 15000,
    orderName: 'SDK 로컬 테스트 주문',
    channel: 'ONLINE',
    successUrl: 'http://localhost:3000/success',
    failUrl: 'http://localhost:3000/fail',
  },
  { idempotencyKey: `sdk-local-${Date.now()}-create` },
);

console.log(created.paymentId, created.redirectUrl);
```

수동 확인 절차:

1. `redirectUrl`을 브라우저에서 엽니다.
2. 로컬 simulator 또는 모바일 플로우로 결제를 완료합니다.
3. `payments.get(paymentId)`를 호출합니다.
4. 상태가 `PAID`로 바뀌었는지 확인합니다.

Polling 확인:

```typescript
const payment = await erumpay.payments.waitForStatus(created.paymentId, {
  intervalMs: 1000,
  timeoutMs: 60000,
});

console.log(payment.status);
```

## 배포 전 필수 확인

SDK v1 배포 전 아래 명령은 모두 통과해야 합니다.

```bash
npm run typecheck
npm test
npm run build
```

그다음 README 예제가 생성된 `.d.ts` 기준으로 타입 오류 없이 동작하는지 확인합니다.

## English Summary

Run `npm run typecheck`, `npm test`, and `npm run build` before publishing.
For local integration, start `payment-service`, create a payment with
`payments.request()`, open `redirectUrl`, complete checkout, then confirm `PAID`
with `payments.get()` or `payments.waitForStatus()`.
