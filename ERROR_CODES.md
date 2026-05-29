# ErumPay SDK 에러 코드

이 문서는 Open SDK를 사용하는 가맹점 개발자와 ErumPay 내부 서비스 구현자가 함께 보는 공개 에러 코드 계약입니다.

payment-service의 내부 예외 이름은 언제든 바뀔 수 있지만, SDK API가 반환하는 `code`는 이 문서 기준으로 안정적으로 유지해야 합니다.

## SDK 에러 코드의 범위

Open SDK는 가맹점 쇼핑몰이 ErumPay 결제창을 열고, 결제 상태를 조회하고, 가맹점 취소를 요청하는 입구입니다.

따라서 이 문서에는 **가맹점이 SDK로 직접 호출하는 API에서 받을 수 있는 에러만** 정리합니다.

현재 SDK 공개 API:

```typescript
erumpay.payments.request({...});    // 결제창 생성/진입
erumpay.payments.get(paymentId);    // 결제 상태 조회
erumpay.payments.cancel(paymentId); // 가맹점 결제 취소
```

더치페이, 원격결제, 카드추천, PIN 인증은 ErumPay 결제창 또는 ErumPay 앱 내부 기능입니다. 가맹점은 이 기능들을 SDK 메서드로 직접 만들지 않습니다.

예를 들어 가맹점이 `payments.request()`를 호출하면 ErumPay 결제창이 열리고, 그 안에서 사용자가 카드추천, 더치페이, 원격결제, 인증을 진행합니다. 가맹점은 그 내부 과정을 코드로 제어하지 않고 최종 결제 결과만 확인합니다.

그래서 `DUTCH_*`, `REMOTE_*`, `AUTH_PIN_*`, `NOTIFICATION_*` 같은 내부 기능 코드는 이 SDK 공개 문서에 넣지 않습니다. 해당 코드는 각 서비스 내부 문서나 운영/연동 테스트 문서에서 관리하고, 가맹점 SDK 응답으로 노출해야 할 때만 `PAYMENT_*`, `PG_*`, `COMMON_*` 같은 공개 코드로 매핑합니다.

## 에러 응답 형식

SDK가 호출하는 외부 API는 실패 시 아래 필드를 반환합니다.

```json
{
  "status": 409,
  "error": "CONFLICT",
  "code": "PAYMENT_IDEMPOTENCY_CONFLICT",
  "message": "동일 멱등키 요청이 이미 처리되었습니다.",
  "requestId": "req_20260529_xxx"
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `status` | 예 | HTTP 상태 코드입니다. |
| `error` | 예 | HTTP reason phrase 또는 큰 범주의 에러 유형입니다. |
| `code` | 예 | SDK 사용자가 분기 처리할 때 쓰는 안정적인 공개 에러 코드입니다. |
| `message` | 예 | 개발자가 원인을 이해할 수 있도록 제공하는 설명입니다. 사용자 화면에 그대로 노출하기보다는 서비스 문구로 변환하는 것을 권장합니다. |
| `requestId` | 예 | 문의, 로그 추적, 운영 확인에 사용하는 요청 ID입니다. |
| `details` | 선택 | validation 필드 단위 정보입니다. 민감정보, 카드 원문, 토큰 값은 포함하면 안 됩니다. |

SDK에서는 모든 서버 에러가 `ErumPayError`로 변환됩니다.

```typescript
import { ErumPayError } from '@erumpay/sdk';

try {
  await erumpay.payments.request(
    { amount: 15000, orderName: 'Americano', channel: 'ONLINE' },
    { idempotencyKey: 'order-1001-create' },
  );
} catch (e) {
  if (e instanceof ErumPayError) {
    console.error(e.status, e.code, e.message, e.requestId);
  }
}
```

## 코드 네이밍

공개 에러 코드는 아래 형식을 사용합니다.

```text
{DOMAIN}_{CATEGORY}_{REASON}
```

예시:

```text
COMMON_INVALID_REQUEST
MERCHANT_API_KEY_INVALID
PAYMENT_IDEMPOTENCY_CONFLICT
PG_PAYMENT_UNAVAILABLE
```

원칙:

- `message`가 아니라 `code`로 분기합니다.
- HTTP status는 대분류이고, 실제 비즈니스 처리는 `code` 기준입니다.
- 내부 서비스 코드, SQL 오류, Feign URL, 토큰, 카드번호, billing key는 공개 응답에 넣지 않습니다.
- 공개 API에서는 `UNKNOWN` 발생을 최소화합니다. SDK가 JSON이 아닌 응답이나 gateway 오류를 받는 경우에만 `UNKNOWN`이 될 수 있습니다.

## 가맹점 결제 API 코드

현재 Open SDK가 직접 사용하는 payment-service API입니다.

대상 API:

- `POST /api/v1/merchant/payments`
- `GET /api/v1/merchant/payments/{paymentId}`
- `POST /api/v1/merchant/payments/{paymentId}/cancel`

| 코드 | HTTP | 의미 | 권장 처리 |
| --- | --- | --- | --- |
| `COMMON_INVALID_REQUEST` | 400 | 요청 본문, path variable, header, JSON 형식 중 하나가 올바르지 않습니다. | 요청 값을 수정한 뒤 다시 호출합니다. |
| `MERCHANT_API_KEY_MISSING` | 401 | API key가 전달되지 않았습니다. | `ErumPayClient` 생성 시 `apiKey` 설정을 확인합니다. |
| `MERCHANT_API_KEY_INVALID` | 401 | API key 형식이 잘못됐거나 유효하지 않습니다. | 가맹점 API key를 확인하거나 재발급합니다. |
| `MERCHANT_FORBIDDEN` | 403 | 해당 가맹점이 요청한 결제에 접근할 수 없습니다. | 결제 ID가 내 가맹점의 결제인지, 환경이 맞는지 확인합니다. |
| `PAYMENT_NOT_FOUND` | 404 | 해당 가맹점 기준으로 결제를 찾을 수 없습니다. | `paymentId`와 호출 환경을 확인합니다. |
| `PAYMENT_AMOUNT_MISMATCH` | 400 | 요청 금액이 결제 금액과 일치하지 않습니다. | 올바른 금액으로 요청을 다시 생성합니다. |
| `PAYMENT_IDEMPOTENCY_CONFLICT` | 409 | 같은 멱등키가 다른 요청 내용으로 이미 사용되었습니다. | 무작정 재시도하지 말고 기존 결제를 조회하거나, 새 주문이면 새 멱등키를 사용합니다. |
| `PAYMENT_REQUEST_IN_PROGRESS` | 409 | 결제 요청이 아직 처리 중입니다. | 바로 재요청하지 말고 `payments.get(paymentId)`로 상태를 확인합니다. |
| `PAYMENT_CANCEL_NOT_ALLOWED` | 409 | 현재 결제 상태에서는 취소할 수 없습니다. | 결제 상태를 확인합니다. 이미 취소된 결제가 200으로 반환되면 성공으로 처리합니다. |
| `PG_CANCEL_REJECTED` | 400 | 하위 PG 또는 결제 처리 시스템에서 취소를 거절했습니다. | 취소 실패로 안내하고, 필요하면 `requestId`와 함께 문의합니다. |
| `PG_PAYMENT_UNAVAILABLE` | 503 | 결제 처리 시스템을 일시적으로 사용할 수 없습니다. | 잠시 후 재시도합니다. 결제가 생성됐을 가능성이 있으면 상태 조회를 먼저 합니다. |
| `COMMON_INTERNAL_ERROR` | 500 | 예상하지 못한 서버 오류가 발생했습니다. | 같은 멱등키로 재시도하거나, `requestId`와 함께 문의합니다. |

## 멱등성

결제 생성과 취소 요청에는 안정적인 `Idempotency-Key`를 사용합니다.

```typescript
await erumpay.payments.request(
  {
    amount: 15000,
    orderName: 'Americano',
    channel: 'ONLINE',
  },
  { idempotencyKey: 'order-1001-create' },
);
```

기대 동작:

| 상황 | 기대 결과 |
| --- | --- |
| 같은 가맹점, 같은 key, 같은 결제 생성 요청 | 기존 결제 결과를 반환합니다. |
| 같은 가맹점, 같은 key, 다른 결제 생성 요청 | `PAYMENT_IDEMPOTENCY_CONFLICT`를 반환합니다. |
| 같은 취소 key, 이미 취소된 결제 | 이미 취소된 결제라면 성공 응답을 반환합니다. |
| 아직 처리 중인 결제 | `PAYMENT_REQUEST_IN_PROGRESS` 또는 조회 가능한 결제 상태를 반환합니다. |

## 재시도 가이드

| 코드 | 재시도 여부 | 설명 |
| --- | --- | --- |
| `COMMON_INVALID_REQUEST` | 아니오 | 요청 값을 먼저 수정해야 합니다. |
| `MERCHANT_API_KEY_MISSING` | 아니오 | SDK 설정을 수정해야 합니다. |
| `MERCHANT_API_KEY_INVALID` | 아니오 | API key를 수정하거나 재발급해야 합니다. |
| `MERCHANT_FORBIDDEN` | 아니오 | 결제 소유권과 권한을 확인해야 합니다. |
| `PAYMENT_NOT_FOUND` | 아니오 | 결제 ID 또는 호출 환경을 확인해야 합니다. |
| `PAYMENT_IDEMPOTENCY_CONFLICT` | 아니오 | 무작정 재시도하면 안 됩니다. 기존 결제를 조회하거나 새 key를 사용합니다. |
| `PAYMENT_REQUEST_IN_PROGRESS` | 조회 방식으로 가능 | 가능한 경우 `payments.get(paymentId)`로 상태를 확인합니다. |
| `PG_PAYMENT_UNAVAILABLE` | 예 | 잠시 후 재시도합니다. 결제가 생성됐을 수 있으면 상태 조회를 먼저 합니다. |
| `COMMON_INTERNAL_ERROR` | 예 | 같은 멱등키로 재시도합니다. 반복되면 `requestId`와 함께 문의합니다. |

## 내부 서비스 구현 가이드

다른 서비스에서 같은 체계를 구현할 때도, 모든 내부 에러를 SDK 문서에 싣지는 않습니다.

원칙은 **외부 가맹점이 직접 호출하는 API boundary에서만 공개 에러 코드로 정리**하는 것입니다. 내부 서비스끼리 주고받는 에러, 결제창 내부 사용자 플로우의 에러, 운영자가 봐야 하는 보상 트랜잭션 에러는 별도 내부 문서로 관리합니다.

구현 규칙:

1. 외부 API 에러 응답에는 `status`, `error`, `code`, `message`, `requestId`를 포함합니다.
2. 내부 예외는 controller, gateway, external API boundary에서 공개 코드로 매핑합니다.
3. 호출자가 직접 처리할 수 없는 내부 서비스명은 공개 코드에 노출하지 않습니다.
4. 코드는 Java 예외 클래스명이 아니라, 호출자가 행동할 수 있는 비즈니스 원인을 표현해야 합니다.
5. validation 실패는 기본적으로 `COMMON_INVALID_REQUEST`를 사용합니다. 필드 단위 안내가 필요할 때만 `details`를 제한적으로 노출합니다.
6. 외부 의존성 timeout, circuit open은 Feign/host 원문이 아니라 공개 unavailable/timeout 코드로 변환합니다.
7. 결제 timeout은 정산/대사로 최종 실패가 확인되기 전까지 확정 실패로 취급하지 않습니다.
8. 알림 발송 실패는 외부 결제 API에서 결제 성공/실패 상태를 바꾸면 안 됩니다.

가맹점 결제 API의 권장 내부 코드 -> 공개 코드 매핑:

| Internal Error | Public Code |
| --- | --- |
| `BAD_REQUEST` | `COMMON_INVALID_REQUEST` |
| `FORBIDDEN` | `MERCHANT_FORBIDDEN` |
| `MERCHANT_API_KEY_MISSING` | `MERCHANT_API_KEY_MISSING` |
| `MERCHANT_API_KEY_INVALID` | `MERCHANT_API_KEY_INVALID` |
| `PAY_NOT_FOUND` | `PAYMENT_NOT_FOUND` |
| `AMOUNT_MISMATCH` | `PAYMENT_AMOUNT_MISMATCH` |
| `DUPLICATED_REQUEST` | `PAYMENT_IDEMPOTENCY_CONFLICT` |
| `REQUEST_IN_PROGRESS` | `PAYMENT_REQUEST_IN_PROGRESS` |
| `CANCELED_INVALID` | `PAYMENT_CANCEL_NOT_ALLOWED` |
| `CANCELED_CARD_INVALID` | `PAYMENT_CANCEL_NOT_ALLOWED` |
| `CANCELED_PG_REJECTED` | `PG_CANCEL_REJECTED` |
| `INTERNAL_PG_SERVER_ERROR` | `PG_PAYMENT_UNAVAILABLE` |
| `INTERNAL_SERVER_ERROR` | `COMMON_INTERNAL_ERROR` |

## 외부에 노출하면 안 되는 값

SDK API 에러 응답에는 아래 값을 절대 포함하지 않습니다.

- stack trace
- SQL 오류 원문
- Feign URL
- 내부 host 이름 또는 port
- 카드번호, CVC, raw card token
- billing key
- PG authorization token
- 사용자 전화번호 또는 생년월일
- 개인정보가 포함된 Kafka payload
