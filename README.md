# @erumpay/sdk

TypeScript SDK for ErumPay merchant server payment integration.

This package is currently a **merchant server SDK**. Keep the merchant API key on
the merchant backend and do not expose it in browser/mobile client bundles.

## Install

```bash
npm install @erumpay/sdk
```

## Runtime Configuration

Manage credentials and endpoints with environment variables in the merchant
server application. See `.env.example` for a local development sample.

```env
ERUMPAY_API_KEY=test_1_local
ERUMPAY_BASE_URL=http://localhost:8083
```

```typescript
import { ErumPayClient } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
  baseURL: process.env.ERUMPAY_BASE_URL!,
});
```

Local endpoint notes:

| Target | Base URL | When to use |
| --- | --- | --- |
| API Gateway | `http://localhost:8080` | Integrated local flow through gateway |
| payment-service | `http://localhost:8083` | Direct payment-service development test |

`merchant-service` runs on port `8094`, but this SDK does not call
merchant-service directly. The SDK calls the merchant payment API implemented in
payment-service:

```text
POST /api/v1/merchant/payments
GET  /api/v1/merchant/payments/{paymentId}
POST /api/v1/merchant/payments/{paymentId}/cancel
```

## Quick Start

```typescript
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

// The merchant frontend can redirect the buyer to ErumPay checkout.
// This redirect should happen after the merchant server creates the payment.
console.log(paymentId, redirectUrl);

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

### `payments.request(params, options?)`

Creates a merchant payment and returns ErumPay checkout entry data.

Endpoint:

```text
POST /api/v1/merchant/payments
```

### `payments.get(paymentId)`

Fetches merchant-owned payment details.

Endpoint:

```text
GET /api/v1/merchant/payments/{paymentId}
```

### `payments.cancel(paymentId, options?)`

Cancels a merchant-owned payment.

Endpoint:

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
    { idempotencyKey: 'order-1001-create' },
  );
} catch (e) {
  if (e instanceof ErumPayError) {
    console.error(e.status, e.code, e.message, e.requestId, e.correlationId);
  }
}
```

Expected error payload shape:

```json
{
  "status": 409,
  "error": "CONFLICT",
  "code": "PAYMENT_IDEMPOTENCY_CONFLICT",
  "message": "The same idempotency key has already been used.",
  "requestId": "req_20260529_xxx",
  "correlationId": "pay_018fc9d2",
  "details": []
}
```

`requestId`, `correlationId`, and `details` are optional. They are only useful
when the backend actually returns them.

See [ERROR_CODES.md](./ERROR_CODES.md) for public merchant API error codes.

## Browser Checkout SDK

This package does not yet provide a browser checkout SDK.

The likely split is:

| Package | Runs in | Responsibility |
| --- | --- | --- |
| `@erumpay/sdk` | Merchant server | Create/read/cancel merchant payments with API key |
| `@erumpay/checkout-js` | Browser/mobile webview | Open ErumPay checkout with public checkout data |

For now, the merchant server should call `payments.request()` and pass the
returned `redirectUrl` to the merchant frontend. The frontend can then redirect
the buyer to the ErumPay checkout screen.

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd test
```

## License

MIT
