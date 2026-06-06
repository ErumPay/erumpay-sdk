# ErumPay SDK 에러 코드

이 문서는 `@erumpay/sdk`를 사용하는 한국 가맹점 개발자를 위한 공개 에러 코드 문서입니다.

SDK는 가맹점이 직접 호출하는 API 경계에서 발생할 수 있는 에러만 문서화합니다.

```typescript
erumpay.payments.request({...});
erumpay.payments.get(paymentId);
erumpay.payments.cancel(paymentId);
```

내부 서비스 예외, SQL 오류, Feign URL, 카드번호, billing key, PG token, 개인정보는 공개 SDK 응답에
노출하면 안 됩니다.

## 에러 응답 형식

실패한 API 응답은 SDK에서 `ErumPayError`로 변환됩니다.

```json
{
  "status": 409,
  "error": "CONFLICT",
  "code": "PAYMENT_IDEMPOTENCY_CONFLICT",
  "message": "같은 멱등키가 다른 요청 내용으로 이미 사용되었습니다.",
  "requestId": "req_20260606_xxx",
  "details": {
    "field": "Idempotency-Key"
  }
}
```

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `status` | 예 | HTTP 상태 코드입니다. |
| `error` | 아니오 | HTTP reason phrase 또는 큰 범주의 에러 유형입니다. |
| `code` | 예 | 가맹점 코드에서 분기 처리할 안정적인 공개 에러 코드입니다. |
| `message` | 예 | 개발자용 설명입니다. 구매자 화면에 그대로 노출하지 않는 것을 권장합니다. |
| `requestId` | 권장 | 운영 문의와 로그 추적에 사용하는 요청 ID입니다. |
| `details` | 선택 | 제한적인 validation 세부 정보입니다. 민감정보를 포함하면 안 됩니다. |

## 공개 에러 코드

| 코드 | HTTP | 의미 | 권장 처리 |
| --- | --- | --- | --- |
| `COMMON_INVALID_REQUEST` | 400 | 요청 본문, path variable, header, JSON 형식이 올바르지 않습니다. | 요청 값을 수정한 뒤 다시 호출합니다. |
| `MERCHANT_API_KEY_MISSING` | 401 | API Key가 전달되지 않았습니다. | `ErumPayClient` 설정을 확인합니다. |
| `MERCHANT_API_KEY_INVALID` | 401 | API Key 형식이 잘못됐거나 만료/폐기/미등록 상태입니다. | 가맹점 API Key를 재확인하거나 재발급합니다. |
| `MERCHANT_FORBIDDEN` | 403 | 해당 가맹점이 요청한 결제에 접근할 수 없습니다. | `paymentId`, 가맹점, 호출 환경을 확인합니다. |
| `PAYMENT_NOT_FOUND` | 404 | 해당 가맹점 기준으로 결제를 찾을 수 없습니다. | `paymentId`와 테스트/운영 환경을 확인합니다. |
| `PAYMENT_AMOUNT_MISMATCH` | 400 | 요청 금액이 기대 금액과 일치하지 않습니다. | 올바른 금액으로 결제를 새로 생성합니다. |
| `PAYMENT_IDEMPOTENCY_CONFLICT` | 409 | 같은 멱등키가 다른 요청 내용으로 이미 사용되었습니다. | 무작정 재시도하지 말고 기존 결제를 조회하거나 새 주문에는 새 key를 사용합니다. |
| `PAYMENT_REQUEST_IN_PROGRESS` | 409 | 결제 요청이 아직 처리 중입니다. | 잠시 후 `payments.get(paymentId)`로 상태를 확인합니다. |
| `PAYMENT_CANCEL_NOT_ALLOWED` | 409 | 현재 결제 상태에서는 취소할 수 없습니다. | 결제 상태를 확인합니다. 이미 취소된 성공 응답은 최종 상태로 처리합니다. |
| `PG_CANCEL_REJECTED` | 400 | 하위 PG가 취소를 거절했습니다. | 취소 실패로 안내하고, 필요하면 `requestId`와 함께 문의합니다. |
| `PG_PAYMENT_UNAVAILABLE` | 503 | 결제 처리 시스템을 일시적으로 사용할 수 없습니다. | 같은 멱등키로 나중에 재시도하거나 먼저 결제 상태를 조회합니다. |
| `COMMON_INTERNAL_ERROR` | 500 | 예상하지 못한 서버 오류입니다. | 같은 멱등키로 재시도합니다. 반복되면 `requestId`와 함께 문의합니다. |
| `UNKNOWN` | 다양 | SDK가 공개 에러 응답을 파싱하지 못했습니다. | status, message, requestId를 로그에 남기고 반복되면 문의합니다. |

## 재시도 가이드

| 코드 또는 에러 | 재시도 여부 | 설명 |
| --- | --- | --- |
| `ErumPayConnectionError` | 예 | 멱등 요청은 같은 key로 재시도하거나 결제 상태를 먼저 조회합니다. |
| `PG_PAYMENT_UNAVAILABLE` | 예 | 같은 `Idempotency-Key`를 사용합니다. |
| `COMMON_INTERNAL_ERROR` | 예 | 같은 `Idempotency-Key`를 사용합니다. |
| `PAYMENT_REQUEST_IN_PROGRESS` | 조회 권장 | 새 결제를 만들지 말고 `payments.get(paymentId)`로 확인합니다. |
| `PAYMENT_IDEMPOTENCY_CONFLICT` | 아니오 | 같은 key를 다른 요청에 사용한 상태입니다. |
| `COMMON_INVALID_REQUEST` | 아니오 | 요청 값을 수정해야 합니다. |
| `MERCHANT_API_KEY_INVALID` | 아니오 | 인증 정보를 수정해야 합니다. |
| `MERCHANT_FORBIDDEN` | 아니오 | 소유권 또는 환경을 확인해야 합니다. |
| `PAYMENT_NOT_FOUND` | 아니오 | 결제 ID 또는 환경을 확인해야 합니다. |

## 내부 에러와 공개 코드 매핑

| 내부 에러 | 공개 코드 |
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

## 공개 응답에 넣으면 안 되는 값

- stack trace
- SQL 오류 원문
- 내부 host 이름 또는 port
- Feign URL
- 카드번호, CVC, raw card token, billing key, PG authorization token
- 구매자 전화번호, 생년월일 등 개인정보
- 내부 Kafka payload 또는 운영자용 이벤트 데이터

## English Summary

This document defines public error codes returned through `@erumpay/sdk`.
Merchant code should branch on `code`, not on `message`.

Retry idempotent create/cancel requests with the same `Idempotency-Key`.
Never expose internal errors, card data, billing keys, PG tokens, or personal data
through public SDK responses.
