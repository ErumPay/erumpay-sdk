# ErumPay SDK 문서 전략

## 대상 독자

기본 대상은 **한국 가맹점 개발자**입니다.

따라서 공식 문서는 한국어를 먼저 제공하고, 영어는 삭제하지 않고 하단 요약 또는 부록으로 제공합니다.
코드 예제는 TypeScript 기준으로 유지하되, 설명 문장과 플로우 해설은 한국어를 기본으로 씁니다.

## 공식 SDK 문서에서 배운 점

Stripe는 REST API 구조, base URL, JSON 응답, HTTP status, 인증, test/sandbox, POST 멱등성,
웹훅 설정을 서버 연동 문서에서 명확히 분리합니다.

Toss Payments는 결제 위젯 연동을 단계별로 설명합니다. 결제 요청, redirect 처리, 승인 요청,
API 응답 확인처럼 개발자가 실제로 따라 할 순서가 앞에 옵니다.

PortOne은 서버 SDK 사용법, typed client, SDK 전용 에러, 웹훅 검증, 버전 안정성을 한 문서에서
명확히 보여줍니다.

## ErumPay v1 문서 방향

ErumPay v1 문서는 좁고 실무적으로 가야 합니다.

v1에서 약속하는 범위:

- 가맹점 서버에서 결제 생성
- 구매자를 ErumPay 결제창으로 이동
- 결제 상태 조회
- 결제 완료 건 취소
- 에러와 멱등성 안전 처리

`@erumpay/sdk` v1 범위 밖:

- 브라우저 checkout 렌더링
- 모바일 deep link bridge
- 카드 추천 내부 로직
- 더치페이 내부 로직
- PIN 인증 내부 로직
- PG simulator 내부 구현

이 내용은 checkout-js, 모바일 앱, 내부 API, 운영 문서로 분리합니다.

## 권장 문서 구조

```text
README.md
  설치
  빠른 시작
  결제 흐름
  어떤 화면을 만들어야 하나요?
  API
  멱등성
  에러 처리
  설정 옵션
  SDK 테스트
  English Summary

ERROR_CODES.md
  에러 응답 형식
  공개 에러 코드
  재시도 가이드
  내부 에러와 공개 코드 매핑
  English Summary

docs/SDK_TESTING.md
  단위 테스트
  빌드 테스트
  로컬 결제 플로우 테스트
  배포 전 필수 확인

docs/DEMO_PAGE_PLAN.md
  가맹점 데모 페이지 목표
  화면 구성
  샘플 백엔드 경계
  테스트 시나리오

docs/WEBHOOKS.md (추후)
  서명 검증
  이벤트 타입
  웹훅 멱등 처리
  로컬 테스트

docs/CHECKOUT_JS_PLAN.md (추후)
  프론트엔드 패키지 경계
  데스크톱/모바일 동작
  deep link fallback
```

## 문서 작성 규칙

- 한국어를 먼저 씁니다.
- 영어는 하단 요약 또는 부록으로 유지합니다.
- 가장 안전한 연동 경로를 먼저 보여줍니다.
- 가맹점 API Key는 백엔드 예제에서만 보여줍니다.
- 결제 생성과 취소 예제에는 항상 멱등키를 넣습니다.
- 에러 로깅 예제에는 `requestId`를 포함합니다.
- polling을 써도 되는 경우와 웹훅을 써야 하는 경우를 구분합니다.
- 구현되지 않은 기능은 “현재 가능”처럼 쓰지 않습니다.
- 예제 코드는 TypeScript에서 실제로 컴파일되는 형태로 유지합니다.

## v1 남은 문서 작업

- 웹훅 서명 기능이 생긴 뒤 웹훅 문서 추가
- checkout-js 패키지가 생긴 뒤 프론트엔드 문서 추가
- 실행 가능한 Express 샘플 가맹점 백엔드 추가
- API Key, redirectUrl, CORS, timeout, idempotency troubleshooting 문서 추가
- v1.1 전 changelog와 migration 문서 추가

## English Summary

The primary audience is Korean merchant developers, so Korean documentation must
come first. English content should remain as a short summary or appendix.

ErumPay v1 docs should focus on merchant server integration: create a payment,
redirect the buyer, read payment status, cancel a paid payment, and handle
idempotency/errors safely.
