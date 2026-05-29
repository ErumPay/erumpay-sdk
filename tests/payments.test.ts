import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErumPayClient } from '../src/client';
import { ErumPayError } from '../src/errors';

// fetch를 가짜로 바꿔서 실제 서버 없이 SDK 동작만 테스트한다
function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    text: async () => JSON.stringify(response),
    json: async () => response,
  });
}

describe('ErumPayClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('apiKey 없이 생성하면 에러를 던진다', () => {
    // @ts-expect-error 의도적으로 apiKey 누락
    expect(() => new ErumPayClient({})).toThrow();
  });

  it('payments.request는 Idempotency-Key를 자동으로 붙인다', async () => {
    const fetchMock = mockFetch({
      paymentId: 'pay_1',
      orderNo: 'ord_1',
      redirectUrl: 'https://erumpay.com/checkout/pay_1',
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const erumpay = new ErumPayClient({ apiKey: 'test_key' });
    await erumpay.payments.request({
      amount: 15000,
      orderName: '텀블러',
      channel: 'ONLINE',
    });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers['Idempotency-Key']).toBeDefined();
    expect(headers['Authorization']).toBe('Bearer test_key');
  });

  it('payments.get은 결제 정보를 반환한다', async () => {
    global.fetch = mockFetch({
      paymentId: 'pay_1',
      orderNo: 'ord_1',
      orderName: '텀블러',
      amount: 15000,
      channel: 'ONLINE',
      status: 'PAID',
    }) as unknown as typeof fetch;

    const erumpay = new ErumPayClient({ apiKey: 'test_key' });
    const payment = await erumpay.payments.get('pay_1');

    expect(payment.status).toBe('PAID');
    expect(payment.amount).toBe(15000);
  });

  it('서버가 에러를 주면 ErumPayError를 던진다', async () => {
    global.fetch = mockFetch(
      { code: 'DUPLICATE_PAYMENT', message: '중복 결제입니다' },
      false,
      409,
    ) as unknown as typeof fetch;

    const erumpay = new ErumPayClient({ apiKey: 'test_key' });

    await expect(
      erumpay.payments.request({ amount: 1000, orderName: 'x', channel: 'ONLINE' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'DUPLICATE_PAYMENT',
    });
  });

  it('throw된 에러는 instanceof ErumPayError로 잡힌다', async () => {
    global.fetch = mockFetch({ code: 'X', message: 'y' }, false, 400) as unknown as typeof fetch;
    const erumpay = new ErumPayClient({ apiKey: 'test_key' });

    try {
      await erumpay.payments.get('pay_1');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErumPayError);
    }
  });
});
