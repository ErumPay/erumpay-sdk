# 이룸페이(ErumPay) SDK 가맹점 연동 가이드

이 가이드는 쇼핑몰, 예약 서비스 등 **이룸페이 결제를 연동하려는 가맹점 개발자**를 위한 문서입니다.  
**이룸페이 결제 기능을 내 서비스에 붙이고 싶은 분**을 대상으로 합니다.

---

## 목차

1. [이 SDK가 하는 일](#1-이-sdk가-하는-일)
2. [시작 전 준비물](#2-시작-전-준비물)
3. [SDK 설치](#3-sdk-설치)
4. [API Key 발급 및 설정](#4-api-key-발급-및-설정)
5. [기본 사용법](#5-기본-사용법)
6. [전체 결제 흐름 이해하기](#6-전체-결제-흐름-이해하기)
7. [에러 처리](#7-에러-처리)
8. [전체 예제 코드](#8-전체-예제-코드)
9. [자주 묻는 질문](#9-자주-묻는-질문)
10. [옵션 전체 목록](#10-옵션-전체-목록)

---

## 1. 이 SDK가 하는 일

이룸페이 SDK는 **가맹점 서버**에서 결제를 만들고, 조회하고, 취소하는 기능을 제공합니다.

SDK가 하는 일:
- 결제 요청 생성 → 이룸페이 앱으로 연결되는 URL 반환
- 결제 상태 조회
- 결제 취소

SDK가 하지 않는 일:
- 실제 카드 결제 처리 (이룸페이 앱이 담당)
- 구매자 화면 UI 제공
- 결제 완료 알림 수신 (웹훅으로 별도 처리)

> **중요**: 이 SDK는 반드시 **서버(백엔드)**에서만 사용해야 합니다.  
> 브라우저, React Native 앱, 클라이언트 코드에 포함하면 API Key가 외부에 노출됩니다.

---

## 2. 시작 전 준비물

### 필수 설치 프로그램

아래 프로그램들이 설치되어 있어야 합니다. 터미널(또는 명령 프롬프트)에서 아래 명령어를 실행해 버전이 출력되면 설치된 것입니다.

**Node.js (버전 18 이상 필요)**

```
node --version
```

출력 예: `v20.11.0`

설치되지 않았다면 [https://nodejs.org](https://nodejs.org) 에서 LTS 버전을 받아 설치하세요.

**Git**

```
git --version
```

출력 예: `git version 2.44.0`

설치되지 않았다면 [https://git-scm.com](https://git-scm.com) 에서 받아 설치하세요.

### 이룸페이 가맹점 계정

이룸페이 관리자로부터 아래 두 가지를 받아야 합니다:
- **API Key** (예: `w0X41gykQ1E-5faJkDtcpQ52BGWpynAoD9WM0AUs6QU`)
- **API 서버 주소** (예: `https://api.erumpay.com`)

---

## 3. SDK 설치

### 방법 A: npm으로 설치 (공식 배포 후 사용 가능)

```bash
npm install @erumpay/sdk
```

### 방법 B: 소스에서 직접 설치 (배포 전 또는 로컬 개발용)

**① SDK 소스코드 받기**

터미널을 열고 SDK를 저장할 폴더로 이동한 뒤 아래 명령어를 실행합니다.

```bash
# 예: 내 프로젝트 폴더 옆에 SDK 폴더를 만들고 싶은 경우
# 내 프로젝트가 C:\my-shop 에 있다면, C:\ 에서 실행합니다

git clone https://github.com/erumpay/erumpay-sdk.git
```

실행 후 `erumpay-sdk` 폴더가 생성됩니다.

**② SDK 빌드**

방금 받은 `erumpay-sdk` 폴더로 이동합니다.

```bash
cd erumpay-sdk
```

필요한 패키지를 설치합니다.

```bash
npm install
```

TypeScript 코드를 JavaScript로 빌드합니다.

```bash
npm run build
```

빌드가 성공하면 `erumpay-sdk/dist/` 폴더가 생성됩니다. 이 폴더가 실제로 사용되는 파일들입니다.

**③ 내 프로젝트에 SDK 연결**

내 프로젝트 폴더로 이동합니다. (SDK 폴더가 아닌 내 서비스 폴더)

```bash
# 예: 내 프로젝트가 C:\my-shop 에 있는 경우
cd C:\my-shop
```

SDK를 로컬 경로로 설치합니다. (`../erumpay-sdk` 는 SDK 폴더가 내 프로젝트 폴더와 같은 위치에 있을 때 사용하는 상대경로입니다. 실제 위치에 맞게 수정하세요.)

```bash
npm install ../erumpay-sdk
```

설치가 완료되면 `package.json` 에 아래와 같이 추가됩니다.

```json
{
  "dependencies": {
    "@erumpay/sdk": "file:../erumpay-sdk"
  }
}
```

---

## 4. API Key 발급 및 설정

### API Key란?

API Key는 이룸페이가 여러분의 가맹점을 식별하는 비밀 열쇠입니다. **절대 외부에 공개하면 안 됩니다.**  
특히 GitHub에 올리거나, 프론트엔드 코드에 포함하거나, 로그에 그대로 출력하면 안 됩니다.

### 환경변수 파일로 관리하기

API Key는 코드에 직접 쓰지 않고, `.env` 파일에 보관합니다.

내 프로젝트 폴더에 `.env` 파일을 만들고 아래 내용을 입력합니다.

```env
ERUMPAY_API_KEY=여기에_발급받은_API_Key를_입력하세요
ERUMPAY_BASE_URL=https://api.erumpay.com
```

> 로컬 개발 중이라면 `ERUMPAY_BASE_URL=http://localhost:8083` 으로 변경합니다.

`.gitignore` 파일에 `.env` 를 추가해서 GitHub에 올라가지 않도록 합니다.

```
# .gitignore
.env
```

---

## 5. 기본 사용법

### SDK 초기화

서버 코드에서 가장 먼저 `ErumPayClient` 를 만듭니다. 앱 전체에서 하나만 만들어 재사용하면 됩니다.

```javascript
// CommonJS 방식 (require)
const { ErumPayClient } = require('@erumpay/sdk');

// 또는 ESM 방식 (import)
import { ErumPayClient } from '@erumpay/sdk';

const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY,
  baseURL: process.env.ERUMPAY_BASE_URL,
});
```

---

### 결제 요청 만들기

구매자가 결제 버튼을 눌렀을 때 서버에서 호출합니다.

```javascript
const payment = await erumpay.payments.request(
  {
    amount: 15000,          // 결제 금액 (원 단위, 정수)
    orderName: '아메리카노 2잔',  // 주문 이름 (구매자에게 표시됨)
    channel: 'ONLINE',      // 결제 채널: 'ONLINE' 또는 'OFFLINE'
    successUrl: 'https://내서비스.com/payment/success',  // 결제 성공 후 이동할 주소
    failUrl: 'https://내서비스.com/payment/fail',        // 결제 실패 후 이동할 주소
  },
  {
    idempotencyKey: 'order-1001-create',  // 중복 결제 방지용 고유 키 (주문번호 기반 권장)
  },
);

console.log(payment.paymentId);   // 결제 고유 번호 (나중에 조회/취소에 사용)
console.log(payment.redirectUrl); // 이룸페이 결제 화면 URL (구매자에게 전달)
console.log(payment.status);      // 현재 결제 상태: 'CREATED'
```

**응답 결과 (payment) 필드 설명:**

| 필드 | 설명 |
|---|---|
| `paymentId` | 결제 고유 번호. 반드시 저장해두세요. |
| `orderNo` | 이룸페이가 생성한 주문번호 |
| `orderName` | 요청한 주문 이름 |
| `amount` | 결제 금액 |
| `channel` | 결제 채널 |
| `status` | 현재 결제 상태 (`CREATED` 로 시작) |
| `redirectUrl` | **구매자를 이룸페이 결제 화면으로 보내는 URL** |
| `qrToken` | QR 코드 결제용 토큰 (PC 결제 시 QR 이미지 생성에 사용) |

---

### 결제 상태 조회

`paymentId` 로 결제 현재 상태를 확인합니다.

```javascript
const payment = await erumpay.payments.get(payment.paymentId);

console.log(payment.status);  // 'CREATED' | 'PAID' | 'CANCELED' | ...
console.log(payment.paidAt);  // 결제 완료 시각 (결제 완료 시에만 값 있음)
```

**결제 상태(status) 종류:**

| 상태 | 설명 |
|---|---|
| `CREATED` | 결제 요청이 생성됨 (아직 구매자가 결제 안 함) |
| `PAY_PENDING` | 구매자가 결제 방법 선택 중 |
| `PG_PENDING` | PG사(카드사)에 결제 요청 중 |
| `PAID` | **결제 완료** |
| `FAILED` | 결제 실패 |
| `EXPIRED` | 결제 시간 초과 (QR 토큰 10분 만료) |
| `CANCELED` | 결제 취소 완료 |
| `VOIDED` | 승인 취소 |

---

### 결제 취소

결제 완료된 주문을 환불/취소합니다.

```javascript
const result = await erumpay.payments.cancel(
  payment.paymentId,
  {
    idempotencyKey: 'order-1001-cancel',  // 취소용 고유 키 (결제 생성 키와 다르게)
  },
);

console.log(result.status);     // 'CANCELED'
console.log(result.canceledAt); // 취소 처리 시각
```

---

### 결제 완료 대기 (로컬 테스트용)

로컬 테스트나 관리자 도구에서 결제 완료를 기다릴 때 편리합니다.  
**실제 운영에서는 웹훅을 사용하는 것을 권장합니다.**

```javascript
// 최대 60초 동안 1초 간격으로 결제 상태를 확인합니다
const payment = await erumpay.payments.waitForStatus(paymentId, {
  intervalMs: 1000,   // 조회 간격 (기본값: 1000ms)
  timeoutMs: 60000,   // 최대 대기 시간 (기본값: 60000ms = 60초)
});

if (payment.status === 'PAID') {
  // 주문 확정 처리
}
```

---

## 6. 전체 결제 흐름 이해하기

이룸페이는 **이룸페이 전용 앱**을 통해 결제가 이루어집니다.  
SDK가 만들어주는 `redirectUrl` 이 핵심입니다.

### PC(웹)에서 결제하는 경우

```
1. 구매자가 PC 웹에서 "결제하기" 버튼 클릭
        ↓
2. 가맹점 서버에서 SDK로 결제 요청 생성
   → payment.redirectUrl 수신
        ↓
3. 가맹점 웹에서 redirectUrl을 QR코드 이미지로 변환해서 화면에 표시
   (QR 이미지 생성 라이브러리: qrcode, qr-image 등)
        ↓
4. 구매자가 본인 스마트폰의 이룸페이 앱으로 QR 스캔
        ↓
5. 이룸페이 앱에서 결제 진행 (카드 선택, PIN 입력 등)
        ↓
6. 결제 완료 → 가맹점 서버로 웹훅 발송 (또는 payments.get()으로 확인)
```

### 모바일(앱)에서 결제하는 경우

```
1. 구매자가 모바일 브라우저 또는 가맹점 앱에서 "결제하기" 버튼 클릭
        ↓
2. 가맹점 서버에서 SDK로 결제 요청 생성
   → payment.redirectUrl 수신
        ↓
3. 구매자 브라우저/앱에서 redirectUrl로 이동
   → 이룸페이 앱이 자동으로 실행됨 (앱-to-앱 방식)
        ↓
4. 이룸페이 앱에서 결제 진행
        ↓
5. 결제 완료 → 가맹점 서버로 웹훅 발송
```

### QR 코드 이미지 만들기 (PC 결제 예시)

```bash
npm install qrcode
```

```javascript
import QRCode from 'qrcode';

// payment.redirectUrl 을 QR 이미지로 변환
const qrImageDataUrl = await QRCode.toDataURL(payment.redirectUrl);

// HTML에서 사용
// <img src={qrImageDataUrl} alt="이룸페이 QR 결제" />
```

---

## 7. 에러 처리

SDK에서 발생하는 에러는 두 가지 종류입니다.

### `ErumPayError` — API 서버가 실패 응답을 보낸 경우

```javascript
import { ErumPayError, ErumPayConnectionError } from '@erumpay/sdk';

try {
  const payment = await erumpay.payments.request(
    { amount: 15000, orderName: '커피', channel: 'ONLINE' },
    { idempotencyKey: 'order-1001-create' },
  );
} catch (error) {
  if (error instanceof ErumPayError) {
    // API 서버가 에러 응답을 보낸 경우
    console.error('HTTP 상태:', error.status);     // 예: 401, 400, 500
    console.error('에러 코드:', error.code);       // 예: 'INVALID_API_KEY'
    console.error('에러 메시지:', error.message);  // 예: '유효하지 않은 API Key입니다.'
    console.error('요청 ID:', error.requestId);    // 문의 시 이룸페이에 전달

    // 에러 코드별 분기 처리 (message 보다 code 기준으로 처리 권장)
    if (error.code === 'INVALID_API_KEY') {
      // API Key 문제
    } else if (error.status === 400) {
      // 요청 데이터 문제
    }
  } else if (error instanceof ErumPayConnectionError) {
    // 네트워크 오류, 타임아웃 등 서버 응답을 받기 전에 실패한 경우
    console.error('연결 오류:', error.message);
  } else {
    throw error; // 예상치 못한 에러는 다시 던지기
  }
}
```

---

## 8. 전체 예제 코드

Node.js Express 서버 기준 전체 예제입니다.

```javascript
// server.js
import express from 'express';
import { ErumPayClient, ErumPayError, ErumPayConnectionError } from '@erumpay/sdk';

const app = express();
app.use(express.json());

// SDK 초기화 (앱 시작 시 한 번만)
const erumpay = new ErumPayClient({
  apiKey: process.env.ERUMPAY_API_KEY,
  baseURL: process.env.ERUMPAY_BASE_URL,
});

// 결제 요청 API
app.post('/api/pay', async (req, res) => {
  const { orderId, amount, orderName } = req.body;

  try {
    const payment = await erumpay.payments.request(
      {
        amount,
        orderName,
        channel: 'ONLINE',
        successUrl: `${process.env.MY_SERVER_URL}/payment/success`,
        failUrl: `${process.env.MY_SERVER_URL}/payment/fail`,
      },
      {
        idempotencyKey: `${orderId}-create`,
      },
    );

    // DB에 paymentId 저장 (나중에 조회/취소에 필요)
    // await db.orders.update({ orderId }, { erumPaymentId: payment.paymentId });

    res.json({
      paymentId: payment.paymentId,
      redirectUrl: payment.redirectUrl,  // 프론트엔드에 전달 (QR 또는 리다이렉트용)
    });
  } catch (error) {
    if (error instanceof ErumPayError) {
      res.status(error.status).json({ error: error.code, message: error.message });
    } else if (error instanceof ErumPayConnectionError) {
      res.status(503).json({ error: 'CONNECTION_ERROR', message: '결제 서버에 연결할 수 없습니다.' });
    } else {
      res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
  }
});

// 결제 상태 조회 API
app.get('/api/pay/:paymentId', async (req, res) => {
  try {
    const payment = await erumpay.payments.get(req.params.paymentId);
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: '조회 실패' });
  }
});

// 결제 취소 API
app.post('/api/pay/:paymentId/cancel', async (req, res) => {
  const { orderId } = req.body;
  try {
    const result = await erumpay.payments.cancel(req.params.paymentId, {
      idempotencyKey: `${orderId}-cancel`,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '취소 실패' });
  }
});

app.listen(3000, () => console.log('서버 시작: http://localhost:3000'));
```

---

## 9. 자주 묻는 질문

### Q. API Key 검증이 계속 실패해요

이룸페이 가맹점은 생성 직후 **심사 대기(DRAFT)** 상태입니다.  
이룸페이 관리자로부터 가맹점이 **활성화(ACTIVE)** 처리가 됐는지 확인하세요.  
활성화 전에는 API Key를 사용해도 인증 오류가 발생합니다.

### Q. QR 코드를 스캔했는데 "만료된 결제"라고 나와요

결제 요청 생성 후 **10분이 지나면 QR 토큰이 만료**됩니다.  
결제 요청 생성 → QR 표시 → 스캔까지 10분 이내에 완료해야 합니다.  
만료됐다면 처음부터 다시 결제를 생성하세요.

### Q. `redirectUrl`을 PC 브라우저에서 열면 "모바일로 이용해주세요"라고 나와요

정상입니다. `redirectUrl`은 이룸페이 **모바일 앱**을 통해 접근해야 합니다.  
PC에서는 QR 코드를 표시하고 스마트폰으로 스캔하도록 UI를 만들어야 합니다.

### Q. 같은 주문인데 네트워크 오류로 결제 요청을 두 번 보냈어요. 중복 결제되나요?

`idempotencyKey`를 같은 값으로 보냈다면 중복 결제되지 않습니다.  
두 번째 요청은 처음 만들어진 결제 정보를 그대로 돌려줍니다.  
반드시 주문번호 기반의 고정된 키를 사용하세요. (예: `order-1001-create`)

### Q. 결제 완료를 어떻게 알 수 있나요?

두 가지 방법이 있습니다:
- **웹훅(권장)**: 이룸페이 서버가 결제 완료 시 가맹점 서버 URL로 자동 통보
- **폴링(테스트용)**: `payments.get(paymentId)` 를 주기적으로 호출해서 `status === 'PAID'` 확인

운영 환경에서는 웹훅을 사용하고, 웹훅 수신 전 사용자에게 결과를 빠르게 보여줄 때만 보조적으로 폴링을 사용하는 것이 좋습니다.

### Q. TypeScript를 사용하는데 타입 정의가 있나요?

네, SDK는 TypeScript로 작성되어 있어 별도 `@types/` 설치 없이 타입이 자동으로 제공됩니다.

```typescript
import type { PaymentRequestResult, Payment, CancelResult } from '@erumpay/sdk';
```

---

## 10. 옵션 전체 목록

### `ErumPayClient` 초기화 옵션

| 옵션 | 필수 | 기본값 | 설명 |
|---|---|---|---|
| `apiKey` | **필수** | 없음 | 이룸페이가 발급한 가맹점 API Key |
| `baseURL` | 선택 | `https://api.erumpay.com` | 이룸페이 API 서버 주소 |
| `timeoutMs` | 선택 | `30000` (30초) | 요청 타임아웃 (밀리초) |
| `maxRetries` | 선택 | `1` | 자동 재시도 횟수 (GET, 멱등 요청에만 적용) |

### `payments.request()` 파라미터

| 파라미터 | 필수 | 설명 |
|---|---|---|
| `amount` | **필수** | 결제 금액 (원 단위 양의 정수) |
| `orderName` | **필수** | 주문 이름 (결제 화면에 표시됨) |
| `channel` | **필수** | `'ONLINE'` 또는 `'OFFLINE'` |
| `successUrl` | 선택 | 결제 성공 후 리다이렉트 URL |
| `failUrl` | 선택 | 결제 실패 후 리다이렉트 URL |

### `payments.request()` 옵션

| 옵션 | 필수 | 설명 |
|---|---|---|
| `idempotencyKey` | **강력 권장** | 중복 결제 방지용 고유 키. 주문번호 기반 권장. |

### `payments.waitForStatus()` 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `intervalMs` | `1000` | 상태 조회 간격 (밀리초) |
| `timeoutMs` | `60000` | 최대 대기 시간 (밀리초) |
| `terminalStatuses` | `['PAID','FAILED','EXPIRED','VOIDED','CANCELED']` | 대기를 멈출 상태 목록 |

---

## 라이선스

MIT
