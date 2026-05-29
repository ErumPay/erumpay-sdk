# @erumpay/sdk

ErumPay 결제 연동 TypeScript SDK. 가맹점이 자기 서비스에 ErumPay 결제를 붙일 수 있게 해줍니다.

## 설치

```bash
npm install @erumpay/sdk
```

## 빠른 시작

```typescript
import { ErumPayClient } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY!,
});

// 1. 결제 생성 → 결제창 진입 URL 받기
const { redirectUrl } = await erumpay.payments.request({
  amount: 15000,
  orderName: '텀블러',
  channel: 'ONLINE', // 'ONLINE' | 'OFFLINE'
  successUrl: 'https://myshop.com/success',
});

// 2. 사용자를 ErumPay 결제창으로 보낸다
window.location.href = redirectUrl;

// 3. 나중에 결제 상태 확인
const payment = await erumpay.payments.get('pay_1');
if (payment.status === 'PAID') {
  // 주문 확정 처리
}
```

## 채널과 결제창

`channel` 값에 따라 ErumPay 결제창이 알아서 다른 버튼을 띄웁니다.
가맹점은 채널만 넘기면 되고, 더치페이/원격결제 UI를 직접 만들 필요가 없습니다.

| channel | 결제창 버튼 |
|---------|------------|
| `OFFLINE` | 결제하기 / 더치페이하기 |
| `ONLINE` | 결제하기 / 원격결제 요청하기 |

## API

### `payments.request(params)`
결제를 생성하고 결제창 진입 정보를 반환합니다. 멱등키는 자동으로 처리됩니다.

### `payments.get(paymentId)`
결제 상세/상태를 조회합니다.

### `payments.cancel(paymentId)`
가맹점이 결제를 취소합니다.

## 에러 처리

```typescript
import { ErumPayError } from '@erumpay/sdk';

try {
  await erumpay.payments.request({ ... });
} catch (e) {
  if (e instanceof ErumPayError) {
    console.error(e.status, e.code, e.message);
  }
}
```

## 개발

```bash
npm install
npm run build      # dist/ 생성
npm test           # 테스트 실행
npm run typecheck  # 타입 체크
```

## 라이선스

MIT
