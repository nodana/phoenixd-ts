import { afterEach, describe, it, expect, vi } from "vitest";
import { Phoenixd } from "../src";
import type { PaymentSocket, PaymentSubscriptionOptions } from "../src";

class FakeSocket implements PaymentSocket {
  listeners = new Map<string, ((event: { data: unknown }) => void)[]>();
  close = vi.fn();

  addEventListener(type: string, listener: (event: { data: unknown }) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  emit(type: string, data?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) listener({ data });
  }
}

const event = {
  type: "payment_received",
  amountSat: 100,
  paymentHash: "hash",
  timestamp: 1000,
};

function setup(overrides: Partial<PaymentSubscriptionOptions> = {}) {
  const sockets: FakeSocket[] = [];
  const factory = vi.fn((_url: string, _protocol: string) => {
    const s = new FakeSocket();

    sockets.push(s);

    return s;
  });
  const onPayment = vi.fn();
  const onError = vi.fn();
  const onStatus = vi.fn();
  const node = new Phoenixd("https://node.example/api", "password");
  const subscription = node.subscribePayments({
    onPayment,
    onError,
    onStatus,
    webSocketFactory: factory,
    ...overrides,
  });

  return { subscription, factory, sockets, onPayment, onError, onStatus };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("payment subscriptions", () => {
  it("authenticates without credentials in the URL and delivers validated notifications", async () => {
    const { subscription, factory, sockets, onPayment } = setup();

    await Promise.resolve();
    expect(factory).toHaveBeenCalledWith(
      "wss://node.example/api/websocket",
      "password",
    );
    sockets[0]!.emit("open");
    expect(subscription.status).toBe("connected");
    sockets[0]!.emit("message", JSON.stringify(event));
    expect(onPayment).toHaveBeenCalledWith(event);
    subscription.close();
    expect(sockets[0]!.close).toHaveBeenCalledTimes(1);
    expect(subscription.status).toBe("closed");
  });

  it("reconnects after disconnects, ignores stale events and stops pending reconnects on close", async () => {
    vi.useFakeTimers();

    const { subscription, sockets, factory, onPayment } = setup({
      reconnectDelayMs: 100,
    });

    await Promise.resolve();
    sockets[0]!.emit("open");
    sockets[0]!.emit("close");
    expect(subscription.status).toBe("reconnecting");
    await vi.advanceTimersByTimeAsync(100);
    expect(factory).toHaveBeenCalledTimes(2);
    sockets[0]!.emit("message", JSON.stringify(event));
    expect(onPayment).not.toHaveBeenCalled();
    sockets[1]!.emit("close");
    subscription.close();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds retries and reports failed connection deadlines", async () => {
    vi.useFakeTimers();

    const { subscription, factory, onError } = setup({
      connectTimeoutMs: 100,
      reconnectDelayMs: 1,
      maxReconnectAttempts: 1,
    });

    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(202);
    expect(subscription.status).toBe("closed");
    expect(factory).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("can close before the first connection is made", async () => {
    const { subscription, factory } = setup();

    subscription.close();
    await Promise.resolve();
    expect(factory).not.toHaveBeenCalled();
  });

  it("can abort during a connection and does not reconnect", async () => {
    const controller = new AbortController();
    const { subscription, sockets } = setup({ signal: controller.signal });

    await Promise.resolve();
    controller.abort();
    expect(subscription.status).toBe("closed");
    expect(sockets[0]!.close).toHaveBeenCalledOnce();
  });

  it("does not connect with a pre-aborted signal", async () => {
    const { subscription, factory } = setup({ signal: AbortSignal.abort() });

    await Promise.resolve();
    expect(factory).not.toHaveBeenCalled();
    expect(subscription.status).toBe("closed");
  });

  it("reports malformed events, ignores future event types and catches callback rejections", async () => {
    const onPayment = vi.fn().mockRejectedValue(new Error("handler failed"));
    const { subscription, sockets, onError } = setup({ onPayment });

    await Promise.resolve();
    sockets[0]!.emit("message", "not-json");
    sockets[0]!.emit(
      "message",
      JSON.stringify({ ...event, timestamp: "invalid" }),
    );
    expect(onError).toHaveBeenCalledTimes(2);
    sockets[0]!.emit("message", JSON.stringify({ type: "future_event" }));
    expect(onError).toHaveBeenCalledTimes(2);
    sockets[0]!.emit("message", JSON.stringify(event));
    await Promise.resolve();
    expect(onError).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "handler failed" }),
    );
    subscription.close();
  });

  it("stops in an observer without leaving a reconnect timer", async () => {
    vi.useFakeTimers();

    const close = () => subscription.close();

    const { subscription, sockets } = setup({
      onStatus: (status) => {
        if (status === "reconnecting") close();
      },
    });

    await Promise.resolve();
    sockets[0]!.emit("error");
    expect(subscription.status).toBe("closed");
    expect(vi.getTimerCount()).toBe(0);
  });
});
