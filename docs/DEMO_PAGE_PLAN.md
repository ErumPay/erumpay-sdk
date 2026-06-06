# SDK 데모 페이지 계획

## 결론

`KAN-1160 5.8.5 SDK 데모 페이지 작성`에서 만들어야 하는 화면은 **가맹점 입장 결제 연동 샘플**입니다.

즉, ErumPay 내부 결제창을 새로 만드는 일이 아닙니다. 가맹점 개발자가 “내 쇼핑몰 백엔드에
`@erumpay/sdk`를 붙이면 이런 흐름으로 결제가 시작되는구나”를 확인하는 데모입니다.

## 데모 페이지 목표

- SDK 결제 생성 흐름을 눈으로 확인할 수 있어야 합니다.
- API Key가 프론트엔드에 노출되지 않는 구조를 보여줘야 합니다.
- `redirectUrl`을 받아 결제창으로 이동하는 흐름을 보여줘야 합니다.
- 결제 상태 조회와 취소 요청까지 SDK API를 체험할 수 있어야 합니다.
- 실패 시 `ErumPayError.code`와 `requestId`를 확인할 수 있어야 합니다.

## 권장 화면 구성

첫 화면:

- 가상의 상품 카드: 상품명, 수량, 금액
- 주문자/주문번호 표시
- `ErumPay로 결제하기` 버튼
- 결제 생성 중 loading 상태
- 결제 생성 실패 시 에러 코드와 requestId 표시

결제 생성 성공 후:

- `paymentId`
- `orderNo`
- `redirectUrl`
- `qrToken`
- 현재 status
- `결제창으로 이동` 버튼
- `상태 다시 조회` 버튼
- `결제 취소` 버튼

개발자 확인 패널:

- SDK base URL
- 사용한 `Idempotency-Key`
- 마지막 API 호출 결과
- 마지막 에러의 `status`, `code`, `message`, `requestId`

## 아키텍처

```text
demo frontend
-> POST /demo/orders
-> demo merchant backend
-> @erumpay/sdk payments.request()
-> payment-service merchant API
-> redirectUrl 반환
-> demo frontend가 redirectUrl로 이동
```

중요한 점:

- `demo frontend`는 가맹점 API Key를 모릅니다.
- API Key는 `demo merchant backend`의 환경 변수에만 있습니다.
- SDK는 `demo merchant backend`에서만 import합니다.
- 프론트엔드는 SDK를 직접 import하지 않습니다.

## 필요한 샘플 백엔드 API

```text
POST /demo/orders
  결제 생성

GET /demo/payments/{paymentId}
  결제 상태 조회

POST /demo/payments/{paymentId}/cancel
  결제 취소
```

## 테스트 시나리오

1. 정상 결제 생성
2. 같은 주문번호로 재시도했을 때 멱등 응답 확인
3. 다른 주문 내용에 같은 멱등키를 사용했을 때 conflict 확인
4. 결제 완료 후 `payments.get()`으로 `PAID` 확인
5. 결제 완료 후 취소 요청
6. API Key 오류 시 `MERCHANT_API_KEY_INVALID` 확인
7. 네트워크 오류 시 `ErumPayConnectionError` 처리 확인

## English Summary

The demo page should represent a merchant checkout sample, not the internal
ErumPay checkout screen. The frontend calls a demo merchant backend, and that
backend uses `@erumpay/sdk` to create, fetch, and cancel payments.
