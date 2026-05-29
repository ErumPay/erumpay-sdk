import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErumPayClient } from '../src/client';
import { ErumPayError } from '../src/errors';

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

  it('throws when apiKey is missing', () => {
    // @ts-expect-error intentionally missing apiKey
    expect(() => new ErumPayClient({})).toThrow();
  });

  it('creates merchant payments with authorization and idempotency headers', async () => {
    const fetchMock = mockFetch({
      paymentId: 1,
      orderNo: 'ord_1',
      orderName: 'Americano',
      amount: 15000,
      channel: 'ONLINE',
      status: 'CREATED',
      redirectUrl: 'https://erumpay.com/checkout/pay_1',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key' });
    await erumpay.payments.request(
      {
        amount: 15000,
        orderName: 'Americano',
        channel: 'ONLINE',
      },
      { idempotencyKey: 'idem_1' },
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('idem_1');
    expect(init.headers['Authorization']).toBe('Bearer test_1_key');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.erumpay.com/api/v1/merchant/payments');
  });

  it('gets merchant payment details', async () => {
    const fetchMock = mockFetch({
      paymentId: 1,
      orderNo: 'ord_1',
      orderName: 'Americano',
      amount: 15000,
      channel: 'ONLINE',
      status: 'PAID',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key' });
    const payment = await erumpay.payments.get(1);

    expect(payment.status).toBe('PAID');
    expect(payment.amount).toBe(15000);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.erumpay.com/api/v1/merchant/payments/1');
  });

  it('throws ErumPayError when server returns an error payload', async () => {
    globalThis.fetch = mockFetch(
      {
        code: 'PAYMENT_IDEMPOTENCY_CONFLICT',
        message: 'Duplicate request',
        requestId: 'req_test',
      },
      false,
      409,
    ) as unknown as typeof fetch;

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key' });

    await expect(
      erumpay.payments.request({ amount: 1000, orderName: 'x', channel: 'ONLINE' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'PAYMENT_IDEMPOTENCY_CONFLICT',
      requestId: 'req_test',
    });
  });

  it('supports instanceof ErumPayError', async () => {
    globalThis.fetch = mockFetch({ code: 'X', message: 'y' }, false, 400) as unknown as typeof fetch;
    const erumpay = new ErumPayClient({ apiKey: 'test_1_key' });

    try {
      await erumpay.payments.get(1);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErumPayError);
    }
  });
});
