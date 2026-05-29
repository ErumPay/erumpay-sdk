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

```typescript
import { ErumPayError } from '@erumpay/sdk';

try {
  await erumpay.payments.request({ amount: 1000, orderName: 'Order', channel: 'ONLINE' });
} catch (e) {
  if (e instanceof ErumPayError) {
    console.error(e.status, e.code, e.message);
  }
}
```

## Development

```bash
npm install
npm run typecheck
npm run build
npm test
```

## License

MIT
