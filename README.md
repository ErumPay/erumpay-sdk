# @erumpay/sdk

TypeScript SDK for ErumPay merchant server payment integration.

This package is currently a **merchant server SDK**. Keep the merchant API key
on the merchant backend and do not expose it in browser or mobile client bundles.

## Install

```bash
npm install @erumpay/sdk
```

## Environment

Manage credentials and endpoints with environment variables.

```env
ERUMPAY_API_KEY=test_1_local
ERUMPAY_BASE_URL=http://localhost:8083
```

Local endpoint guide:

```text
payment-service direct: http://localhost:8083
API Gateway:            http://localhost:8080
```

`merchant-service` runs on port `8094`, but this SDK does not call
merchant-service directly. The SDK calls the merchant payment API implemented in
payment-service.

## Quick Start

```typescript
import { ErumPayClient } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
  baseURL: process.env.ERUMPAY_BASE_URL!,
});

const { paymentId, redirectUrl } = await erumpay.payments.request(
  {
    amount: 15000,
    orderName: 'Americano',
    channel: 'ONLINE',
  },
  { idempotencyKey: 'order-1001-create' },
);

// Send redirectUrl to the merchant frontend.
console.log(paymentId, redirectUrl);

const payment = await erumpay.payments.get(paymentId);
if (payment.status === 'PAID') {
  // Confirm the merchant order.
}
```

## Checkout Redirect

`payments.request()` returns checkout entry data:

```json
{
  "paymentId": 8,
  "redirectUrl": "http://localhost:5173/checkout?token=...",
  "qrToken": "..."
}
```

The server SDK only creates and reads merchant payments. The real buyer-facing
checkout screen is a separate frontend surface.

Recommended flow:

```text
Merchant backend
-> calls erumpay.payments.request()
-> returns redirectUrl to merchant frontend

Merchant frontend
-> redirects buyer to redirectUrl
-> ErumPay checkout/mobile app handles payment
```

The payment-service value that controls `redirectUrl` is:

```env
CHECKOUT_REDIRECT_BASE_URL=http://localhost:5173/checkout?token=
```

Until the checkout frontend is ready, this value may point to a placeholder URL.

## 한국어 가이드

### 현재 SDK의 역할

`@erumpay/sdk`는 현재 **가맹점 서버용 SDK**입니다.

가맹점 프론트나 모바일 앱에서 직접 사용하는 패키지가 아니라, 가맹점 백엔드가
ErumPay 결제 생성/조회/취소 API를 호출할 때 사용합니다. API Key는 반드시
가맹점 서버에만 보관해야 하며, 브라우저나 모바일 앱 번들에 포함하면 안 됩니다.

현재 서버용 SDK 흐름:

```text
가맹점 서버
-> erumpay.payments.request() 호출
-> paymentId, redirectUrl, qrToken 수신
-> 가맹점 프론트에 redirectUrl 전달
-> 사용자가 redirectUrl로 ErumPay 결제 화면 진입
```

### redirectUrl의 의미

`redirectUrl`은 SDK에서만 쓰는 값이 아니라, payment-service의 merchant 결제
생성 API가 내려주는 **온라인 결제창 진입 URL**입니다.

payment-service 설정:

```env
CHECKOUT_REDIRECT_BASE_URL=http://localhost:5173/checkout?token=
```

결제 생성 후 응답 예시:

```json
{
  "paymentId": 8,
  "redirectUrl": "http://localhost:5173/checkout?token=abc123",
  "qrToken": "abc123"
}
```

`CHECKOUT_REDIRECT_BASE_URL`은 기존 모바일 앱의 QR 스캔 화면을 직접 바꾸는 값이
아닙니다. 기존 QR 스캔/QR 이미지 생성용 URL은 payment-service의 `QR_BASEURL`
영역이고, SDK 온라인 결제 진입 URL은 `CHECKOUT_REDIRECT_BASE_URL`로 분리해서
관리합니다.

### 온라인 결제 화면 방향

온라인 결제에서는 가맹점 페이지에 "이룸페이 결제" 버튼을 두고, 버튼 클릭 시
가맹점 서버가 `payments.request()`로 결제 건을 생성합니다.

그 다음 사용자는 `redirectUrl`로 이동합니다.

PC 웹에서는 ErumPay 결제 화면에서 QR을 보여주고, 사용자가 모바일 앱으로 QR을
스캔해 결제를 이어갈 수 있습니다.

모바일 웹에서는 ErumPay 앱 딥링크로 연결하고, 앱 실행이 실패하면 웹 결제 화면
또는 앱 설치 안내 화면으로 fallback할 수 있습니다.

정리하면:

```text
오프라인 결제
-> 매장/가맹점이 QR 생성
-> 사용자가 ErumPay 앱에서 QR 스캔
-> 앱 안에서 결제수단 선택 화면 진입

온라인 PC 결제
-> 가맹점 웹에서 이룸페이 결제 버튼 클릭
-> ErumPay checkout URL로 이동
-> checkout 화면에서 QR 표시
-> 사용자가 앱으로 QR 스캔 후 결제

온라인 모바일 결제
-> 가맹점 모바일 웹/앱에서 이룸페이 결제 버튼 클릭
-> ErumPay 앱 딥링크 또는 checkout URL로 이동
-> 앱 안에서 결제 진행
```

### 프론트용 checkout-js는 후속 작업

현재 `@erumpay/sdk`는 서버용입니다.

프론트에서 결제창을 열거나, PC에서는 QR을 보여주고, 모바일에서는 앱 딥링크를
열어주는 기능은 별도 패키지로 분리하는 것을 권장합니다.

후속 패키지 후보:

```text
@erumpay/checkout-js
```

예상 사용 방식:

```typescript
import { ErumPayCheckout } from '@erumpay/checkout-js';

await ErumPayCheckout.open({
  paymentId: 8,
  redirectUrl: 'http://localhost:5173/checkout?token=abc123',
});
```

`checkout-js`는 API Key를 받지 않아야 합니다. API Key는 서버용 SDK에서만 쓰고,
프론트용 SDK는 서버가 생성해준 `redirectUrl` 또는 공개 checkout token만 사용해야
합니다.

## API

The SDK exposes only merchant-facing payment APIs.

### `payments.request(params, options?)`

Creates a merchant payment and returns ErumPay checkout entry data.

```text
POST /api/v1/merchant/payments
```

### `payments.get(paymentId)`

Fetches merchant-owned payment details.

```text
GET /api/v1/merchant/payments/{paymentId}
```

### `payments.cancel(paymentId, options?)`

Cancels a merchant-owned payment.

```text
POST /api/v1/merchant/payments/{paymentId}/cancel
```

## Errors

Server API failures are converted to `ErumPayError`.

```typescript
import { ErumPayError } from '@erumpay/sdk';

try {
  await erumpay.payments.request(
    { amount: 1000, orderName: 'Order', channel: 'ONLINE' },
    { idempotencyKey: 'order-1-create' },
  );
} catch (e) {
  if (e instanceof ErumPayError) {
    console.error(e.status, e.code, e.message, e.requestId, e.correlationId);
  }
}
```

See [ERROR_CODES.md](./ERROR_CODES.md) for public merchant API error codes.

## Server SDK vs Checkout JS

Current package:

```text
@erumpay/sdk
Target: merchant server
Purpose: create/read/cancel merchant payments with API key
```

Future package:

```text
@erumpay/checkout-js
Target: merchant frontend
Purpose: open ErumPay checkout, redirect to web checkout, or bridge to mobile app
```

Initial checkout-js design:

```typescript
import { ErumPayCheckout } from '@erumpay/checkout-js';

await ErumPayCheckout.open({
  paymentId: 8,
  redirectUrl: 'http://localhost:5173/checkout?token=...',
});
```

Platform behavior:

```text
Desktop web: open checkout page or show QR for mobile app payment
Mobile web:  open ErumPay app deep link, fallback to checkout page
```

## MCP Server Plan

The MCP server is a separate follow-up project. It can use this server SDK
internally to expose ErumPay tools.

Candidate MCP tools:

```text
create_payment
get_payment
cancel_payment
```

MCP should not expose merchant API keys to the model. Credentials should be
provided through server environment variables.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

## Publish Checklist

- Confirm package name and version.
- Run `npm run typecheck`.
- Run `npm run build`.
- Run `npm test`.
- Verify README and `ERROR_CODES.md`.
- Verify package metadata and exported files.
- Publish with the team-owned npm account.

## License

MIT
