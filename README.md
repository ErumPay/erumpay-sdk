# @erumpay/sdk

TypeScript SDK for ErumPay merchant payment integration.

## Install

```bash
npm install @erumpay/sdk
```

## Quick Start

```typescript
import { ErumPayClient } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
});

const { paymentId, redirectUrl } = await erumpay.payments.request(
  {
    amount: 15000,
    orderName: 'Americano',
    channel: 'ONLINE',
    successUrl: 'https://myshop.example/success',
    failUrl: 'https://myshop.example/fail',
  },
  { idempotencyKey: 'order-1001-create' },
);

window.location.href = redirectUrl;

const payment = await erumpay.payments.get(paymentId);
if (payment.status === 'PAID') {
  // Confirm the merchant order.
}
```

## Development Server Keys

Until the real merchant API-key registry is connected on the server, the
payment-service development resolver accepts keys shaped like:

```text
merchant_{merchantId}_{secret}
test_{merchantId}_{secret}
```

For example, `test_1_local` resolves to merchant id `1`.

## API

SDK는 가맹점 쇼핑몰이 ErumPay 결제창을 여는 입구만 제공합니다. 카드추천, 더치페이, 원격결제, PIN 인증은 ErumPay 결제창 또는 앱 내부에서 사용자가 진행하는 기능이며, 가맹점 SDK 메서드로 직접 노출하지 않습니다.

### `payments.request(params, options?)`

Creates a merchant payment and returns ErumPay checkout entry data.

Endpoint: `POST /api/v1/merchant/payments`

### `payments.get(paymentId)`

Fetches merchant payment details.

Endpoint: `GET /api/v1/merchant/payments/{paymentId}`

### `payments.cancel(paymentId, options?)`

Cancels a merchant payment.

Endpoint: `POST /api/v1/merchant/payments/{paymentId}/cancel`

## Errors

서버 API 실패는 모두 `ErumPayError`로 변환됩니다.

```typescript
import { ErumPayError } from '@erumpay/sdk';

try {
  await erumpay.payments.request({ amount: 1000, orderName: 'Order', channel: 'ONLINE' });
} catch (e) {
  if (e instanceof ErumPayError) {
    console.error(e.status, e.code, e.message, e.requestId);
  }
}
```

가맹점 결제 API는 아래처럼 안정적인 공개 에러 응답을 반환합니다.

```json
{
  "status": 409,
  "error": "CONFLICT",
  "code": "PAYMENT_IDEMPOTENCY_CONFLICT",
  "message": "동일 멱등키 요청이 이미 처리되었습니다.",
  "requestId": "req_20260529_xxx"
}
```

전체 공개 코드 표, 재시도 가이드, 멱등성 규칙, 내부 서비스 구현 규칙은 [ERROR_CODES.md](./ERROR_CODES.md)를 기준으로 봅니다.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

## License

MIT
