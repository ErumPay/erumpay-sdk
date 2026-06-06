# @erumpay/sdk

ErumPay 가맹점 서버 결제 연동을 위한 공식 TypeScript SDK입니다.

이 패키지는 **가맹점 서버용 SDK**입니다. 가맹점 API Key는 반드시 백엔드 서버에만 보관해야 하며,
브라우저, 모바일 앱, React Native, 데스크톱 클라이언트 번들에 포함하면 안 됩니다.

## 설치

```bash
npm install @erumpay/sdk
```

## 환경 변수

```env
ERUMPAY_API_KEY=test_1_local
ERUMPAY_BASE_URL=http://localhost:8083
```

로컬 개발 기준 엔드포인트:

| 대상 | Base URL | 사용 시점 |
| --- | --- | --- |
| API Gateway | `http://localhost:8080` | gateway까지 포함한 통합 로컬 테스트 |
| payment-service | `http://localhost:8083` | payment-service 직접 개발/검증 |

`merchant-service`는 `8094` 포트에서 실행되지만, 이 SDK는 `merchant-service`를 직접 호출하지 않습니다.
SDK는 `payment-service`에 구현된 가맹점 결제 API를 호출합니다.

```text
POST /api/v1/merchant/payments
GET  /api/v1/merchant/payments/{paymentId}
POST /api/v1/merchant/payments/{paymentId}/cancel
```

## 빠른 시작

```typescript
import { ErumPayClient, ErumPayError } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
  baseURL: process.env.ERUMPAY_BASE_URL!,
});

try {
  const payment = await erumpay.payments.request(
    {
      amount: 15000,
      orderName: '아메리카노 2잔',
      channel: 'ONLINE',
      successUrl: 'https://merchant.example/success',
      failUrl: 'https://merchant.example/fail',
    },
    { idempotencyKey: 'order-1001-create' },
  );

  // 가맹점 프론트엔드에 redirectUrl을 내려주고, 구매자를 ErumPay 결제 화면으로 이동시킵니다.
  console.log(payment.paymentId, payment.redirectUrl);
} catch (error) {
  if (error instanceof ErumPayError) {
    console.error(error.status, error.code, error.message, error.requestId, error.correlationId);
  }
  throw error;
}
```

## 결제 흐름

```text
가맹점 백엔드
-> erumpay.payments.request() 호출
-> paymentId, redirectUrl, qrToken 수신
-> 가맹점 프론트엔드에 redirectUrl 전달

가맹점 프론트엔드
-> 구매자를 redirectUrl로 이동
-> ErumPay checkout 화면 또는 모바일 앱에서 결제 진행

가맹점 백엔드
-> 추후 웹훅을 받거나, 로컬 테스트에서는 payments.get()으로 상태 확인
-> status가 PAID가 되면 가맹점 주문을 결제 완료 처리
```

결제창 진입 URL을 만드는 서버 설정:

```env
CHECKOUT_REDIRECT_BASE_URL=http://localhost:5173/checkout?token=
```

## 어떤 화면을 만들어야 하나요?

지라 `KAN-1160 5.8.5 SDK 데모 페이지 작성`에서 말하는 화면은 **ErumPay 내부 결제창**이 아니라
**가맹점 입장에서 SDK 연동을 확인하는 데모 화면**입니다.

권장 데모 화면:

- 상품/주문 요약 영역: 상품명, 주문번호, 결제 금액
- 결제 버튼: `ErumPay로 결제하기`
- 요청 결과 영역: `paymentId`, `orderNo`, `redirectUrl`, 현재 결제 상태
- 개발자 확인 영역: 사용한 `Idempotency-Key`, API base URL, 에러 코드와 `requestId`
- 테스트 버튼: 결제 상태 다시 조회, 결제 취소 요청

중요한 경계:

- 데모 프론트엔드는 API Key를 절대 들고 있지 않습니다.
- 데모 프론트엔드는 가맹점 샘플 백엔드에 주문 생성 요청만 보냅니다.
- 샘플 백엔드가 `@erumpay/sdk`로 `payments.request()`를 호출합니다.
- 샘플 백엔드가 받은 `redirectUrl`만 프론트엔드에 내려줍니다.

자세한 화면 설계는 [docs/DEMO_PAGE_PLAN.md](./docs/DEMO_PAGE_PLAN.md)를 참고하세요.

## API

### `payments.request(params, options?)`

가맹점 결제를 생성하고 ErumPay 결제창 진입 정보를 반환합니다.

```typescript
const payment = await erumpay.payments.request(
  {
    amount: 15000,
    orderName: '아메리카노 2잔',
    channel: 'ONLINE',
  },
  { idempotencyKey: 'order-1001-create' },
);
```

### `payments.get(paymentId)`

가맹점 소유 결제의 상세 정보를 조회합니다.

```typescript
const payment = await erumpay.payments.get(8);
```

### `payments.cancel(paymentId, options?)`

결제 완료된 가맹점 결제를 취소합니다.

```typescript
const canceled = await erumpay.payments.cancel(8, {
  idempotencyKey: 'order-1001-cancel',
});
```

### `payments.waitForStatus(paymentId, options?)`

결제가 종료 상태가 될 때까지 짧게 polling합니다.

운영 환경의 주문 확정은 웹훅 기반으로 처리하는 것이 좋습니다. 다만 SDK 테스트, 로컬 데모,
관리자 도구에서는 `waitForStatus()`가 편합니다.

```typescript
const payment = await erumpay.payments.waitForStatus(8, {
  intervalMs: 1000,
  timeoutMs: 60000,
});
```

## 멱등성

결제 생성과 취소 요청에는 안정적인 `Idempotency-Key`를 사용해야 합니다.
가맹점 주문번호와 동작 이름을 조합하는 방식을 권장합니다.

```typescript
await erumpay.payments.request(order, {
  idempotencyKey: `${order.id}-create`,
});

await erumpay.payments.cancel(paymentId, {
  idempotencyKey: `${order.id}-cancel`,
});
```

네트워크 오류가 발생하면 같은 key로 재시도하거나, `payments.get()`으로 결제 상태를 먼저 확인하세요.
새 주문이 아닌데 새 멱등키를 만들어 재요청하면 중복 결제 위험이 생길 수 있습니다.

## 에러 처리

서버 API 실패는 `ErumPayError`로 변환됩니다. 네트워크 실패, 타임아웃, 잘못된 JSON 응답은
`ErumPayConnectionError`로 변환됩니다.

```typescript
import { ErumPayConnectionError, ErumPayError } from '@erumpay/sdk';

try {
  await erumpay.payments.request(
    { amount: 1000, orderName: '테스트 주문', channel: 'ONLINE' },
    { idempotencyKey: 'order-1-create' },
  );
} catch (error) {
  if (error instanceof ErumPayError) {
    console.error(error.status, error.code, error.message, error.requestId, error.correlationId);
  } else if (error instanceof ErumPayConnectionError) {
    console.error(error.message);
  }
}
```

공개 에러 코드는 [ERROR_CODES.md](./ERROR_CODES.md)를 참고하세요.

## 설정 옵션

```typescript
const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
  baseURL: process.env.ERUMPAY_BASE_URL,
  timeoutMs: 30000,
  maxRetries: 1,
});
```

| 옵션 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `apiKey` | 예 | 없음 | ErumPay가 발급한 가맹점 API Key입니다. |
| `baseURL` | 아니오 | `https://api.erumpay.com` | ErumPay API base URL입니다. |
| `timeoutMs` | 아니오 | `30000` | 요청별 타임아웃입니다. |
| `maxRetries` | 아니오 | `1` | GET 또는 멱등 POST 실패 시 자동 재시도 횟수입니다. |
| `fetch` | 아니오 | `globalThis.fetch` | 테스트 또는 특수 런타임에서 사용할 custom fetch입니다. |

## 서버 SDK와 Checkout JS의 경계

현재 패키지:

```text
@erumpay/sdk
대상: 가맹점 서버
목적: API Key로 결제 생성, 조회, 상태 대기, 취소 수행
```

추후 프론트엔드 패키지:

```text
@erumpay/checkout-js
대상: 가맹점 프론트엔드
목적: ErumPay checkout 열기, 웹 결제창 이동, 모바일 앱 deep link 연결
```

`checkout-js`는 가맹점 API Key를 받으면 안 됩니다. 서버가 생성한 `redirectUrl` 또는 공개 checkout token만
사용해야 합니다.

## SDK 테스트

```bash
npm install
npm run typecheck
npm test
npm run build
```

전체 로컬 결제 플로우 테스트는 [docs/SDK_TESTING.md](./docs/SDK_TESTING.md)를 참고하세요.

## 배포 전 체크리스트

- 패키지 이름과 버전을 확인합니다.
- `npm run typecheck`를 실행합니다.
- `npm test`를 실행합니다.
- `npm run build`를 실행합니다.
- README, `ERROR_CODES.md`, `docs/` 문서를 확인합니다.
- package metadata와 `dist` 산출물을 확인합니다.
- 팀 소유 npm 계정으로 배포합니다.

## English Summary

`@erumpay/sdk` is the official TypeScript SDK for ErumPay merchant server integrations.
It must be used only on merchant backends because it requires a merchant API key.

Main APIs:

- `payments.request(params, options?)`
- `payments.get(paymentId)`
- `payments.cancel(paymentId, options?)`
- `payments.waitForStatus(paymentId, options?)`

Use stable idempotency keys for create and cancel requests.

## License

MIT
