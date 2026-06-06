import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErumPayClient } from '../src/client';
import { ErumPayConnectionError, ErumPayError } from '../src/errors';

function mockFetch(response: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers({ 'x-request-id': 'req_header', 'x-correlation-id': 'corr_header' }),
    text: async () => JSON.stringify(response),
    json: async () => response,
  });
}

function mockNonJsonFetch() {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 502,
    statusText: 'Bad Gateway',
    headers: new Headers(),
    text: async () => 'bad gateway',
    json: async () => {
      throw new Error('not json');
    },
  });
}

function mockOkPayment(status = 'PAID') {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    text: async () =>
      JSON.stringify({
        paymentId: 1,
        orderNo: 'ord_1',
        orderName: 'Americano',
        amount: 15000,
        channel: 'ONLINE',
        status,
        redirectUrl: 'https://erumpay.com/checkout/pay_1',
      }),
    json: async () => ({}),
  };
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

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });
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
    expect(init.headers['Accept']).toBe('application/json');
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

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });
    const payment = await erumpay.payments.get(1);

    expect(payment.status).toBe('PAID');
    expect(payment.amount).toBe(15000);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.erumpay.com/api/v1/merchant/payments/1');
  });

  it('cancels merchant payments with an idempotency header', async () => {
    const fetchMock = mockFetch({
      paymentId: 1,
      status: 'CANCELED',
      canceledAt: '2026-06-02T10:00:00',
    });

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });
    await erumpay.payments.cancel(1, { idempotencyKey: 'cancel_1' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Idempotency-Key']).toBe('cancel_1');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.erumpay.com/api/v1/merchant/payments/1/cancel');
  });

  it('throws ErumPayError when server returns an error payload', async () => {
    const fetchMock = mockFetch(
      {
        code: 'PAYMENT_IDEMPOTENCY_CONFLICT',
        message: 'Duplicate request',
        requestId: 'req_test',
        correlationId: 'pay_test',
        details: [{ field: 'amount', message: 'must be positive' }],
      },
      false,
      409,
    );

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });

    await expect(
      erumpay.payments.request({ amount: 1000, orderName: 'x', channel: 'ONLINE' }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'PAYMENT_IDEMPOTENCY_CONFLICT',
      requestId: 'req_test',
      correlationId: 'pay_test',
      details: [{ field: 'amount', message: 'must be positive' }],
    });
  });

  it('falls back to UNKNOWN for non-json error responses', async () => {
    const fetchMock = mockNonJsonFetch();
    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });

    await expect(erumpay.payments.get(1)).rejects.toMatchObject({
      status: 502,
      code: 'UNKNOWN',
      message: 'Bad Gateway',
    });
  });

  it('supports instanceof ErumPayError', async () => {
    const fetchMock = mockFetch({ code: 'X', message: 'y' }, false, 400);
    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });

    try {
      await erumpay.payments.get(1);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ErumPayError);
    }
  });

  it('retries idempotent requests with the same idempotency key', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('temporary network failure')).mockResolvedValueOnce(mockOkPayment('CREATED'));

    const erumpay = new ErumPayClient({
      apiKey: 'test_1_key',
      fetch: fetchMock as unknown as typeof fetch,
      maxRetries: 1,
    });

    await erumpay.payments.request(
      { amount: 15000, orderName: 'Americano', channel: 'ONLINE' },
      { idempotencyKey: 'order-1001-create' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key']).toBe('order-1001-create');
    expect(fetchMock.mock.calls[1][1].headers['Idempotency-Key']).toBe('order-1001-create');
  });

  it('wraps network failures in ErumPayConnectionError', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('socket closed'));
    const erumpay = new ErumPayClient({
      apiKey: 'test_1_key',
      fetch: fetchMock as unknown as typeof fetch,
      maxRetries: 0,
    });

    await expect(erumpay.payments.get(1)).rejects.toBeInstanceOf(ErumPayConnectionError);
  });

  it('waits for a terminal payment status', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(mockOkPayment('PAY_PENDING')).mockResolvedValueOnce(mockOkPayment('PAID'));

    const erumpay = new ErumPayClient({ apiKey: 'test_1_key', fetch: fetchMock as unknown as typeof fetch });
    const payment = await erumpay.payments.waitForStatus(1, { intervalMs: 1, timeoutMs: 100 });

    expect(payment.status).toBe('PAID');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
