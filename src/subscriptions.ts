import { endpoint, validateTimeout } from "./HttpClient";
import type { WebsocketPayment } from "./types";

export type SubscriptionStatus =
  "connecting" | "connected" | "reconnecting" | "closed";

/** Structural subset of the standard WebSocket API, including React Native. */
export interface PaymentSocket {
  addEventListener(
    type: "open" | "close" | "error",
    listener: () => void,
  ): void;
  addEventListener(
    type: "message",
    listener: (event: { data: unknown }) => void,
  ): void;
  close(): void;
}

export interface PaymentSubscriptionOptions {
  onPayment(payment: WebsocketPayment): void | Promise<void>;
  onError?(error: Error): void | Promise<void>;
  onStatus?(status: SubscriptionStatus): void | Promise<void>;
  signal?: AbortSignal;
  /** Reconnect after a disconnect. Defaults to true. */
  reconnect?: boolean;
  /** Consecutive failed connections before stopping. Defaults to 10. */
  maxReconnectAttempts?: number;
  /** Initial delay in milliseconds, doubled up to 30 seconds. Defaults to 1000. */
  reconnectDelayMs?: number;
  /** Connection deadline in milliseconds. Defaults to 10000. */
  connectTimeoutMs?: number;
  /** Supply a socket authenticated with the Phoenixd password. Required by the portable entry point. */
  webSocketFactory?(url: string, password: string): PaymentSocket;
}

export interface PaymentSubscription {
  readonly status: SubscriptionStatus;
  close(): void;
}

function isPayment(value: unknown): value is WebsocketPayment {
  if (typeof value !== "object" || value === null) return false;

  const p = value as Record<string, unknown>;

  return (
    p.type === "payment_received" &&
    typeof p.paymentHash === "string" &&
    typeof p.amountSat === "number" &&
    Number.isFinite(p.amountSat) &&
    typeof p.timestamp === "number" &&
    Number.isFinite(p.timestamp) &&
    ["externalId", "payerNote", "payerKey"].every(
      (key) => p[key] == null || typeof p[key] === "string",
    )
  );
}

export function subscribePayments(
  baseUrl: string,
  password: string,
  options: PaymentSubscriptionOptions,
): PaymentSubscription {
  const url = endpoint(baseUrl, "websocket");

  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

  const factory = options.webSocketFactory;

  if (!factory)
    throw new TypeError(
      "Payment subscriptions require an authenticated webSocketFactory; the Node entry point provides one",
    );

  const delay = options.reconnectDelayMs ?? 1000;
  const deadline = options.connectTimeoutMs ?? 10_000;
  const maxAttempts = options.maxReconnectAttempts ?? 10;

  validateTimeout(delay);
  validateTimeout(deadline);

  if (
    delay < 1 ||
    deadline < 1 ||
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 0
  ) {
    throw new TypeError(
      "Reconnect delay and connection deadline must be positive; maxReconnectAttempts must be a non-negative integer",
    );
  }

  let status: SubscriptionStatus = "connecting";
  let stopped = false;
  let socket: PaymentSocket | undefined;
  let retries = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let connectTimer: ReturnType<typeof setTimeout> | undefined;

  const report = (error: Error) => {
    // A failing error observer must not break connection cleanup or recurse.
    try {
      Promise.resolve(options.onError?.(error)).catch(() => {});
    } catch {
      /* observer owns its exception */
    }
  };

  const notify = (callback: (() => void | Promise<void>) | undefined) => {
    if (!callback) return;

    try {
      Promise.resolve(callback()).catch((cause) =>
        report(
          cause instanceof Error
            ? cause
            : new Error("Subscription callback failed"),
        ),
      );
    } catch (cause) {
      report(
        cause instanceof Error
          ? cause
          : new Error("Subscription callback failed"),
      );
    }
  };

  const update = (next: SubscriptionStatus) => {
    status = next;
    notify(options.onStatus ? () => options.onStatus!(next) : undefined);
  };

  const close = () => {
    if (stopped) return;

    stopped = true;
    clearTimeout(retryTimer);
    clearTimeout(connectTimer);
    options.signal?.removeEventListener("abort", close);

    const current = socket;

    socket = undefined;
    current?.close();
    update("closed");
  };

  const reconnect = () => {
    if (stopped) return;

    if (options.reconnect === false || retries >= maxAttempts) {
      close();

      return;
    }

    const nextDelay = Math.min(30_000, delay * 2 ** Math.min(retries++, 20));

    update("reconnecting");

    if (!stopped) retryTimer = setTimeout(connect, nextDelay);
  };

  const connect = () => {
    if (stopped) return;

    update("connecting");

    if (stopped) return;

    let current: PaymentSocket;

    try {
      current = factory(url.toString(), password);
    } catch {
      report(new Error("Could not start Phoenixd WebSocket connection"));
      reconnect();

      return;
    }

    socket = current;

    const disconnected = () => {
      if (stopped || socket !== current) return;

      clearTimeout(connectTimer);
      socket = undefined;
      current.close();
      reconnect();
    };

    connectTimer = setTimeout(() => {
      if (socket !== current || stopped) return;

      report(new Error("Phoenixd WebSocket connection timed out"));
      disconnected();
    }, deadline);
    current.addEventListener("open", () => {
      if (socket !== current || stopped) return;

      clearTimeout(connectTimer);
      retries = 0;
      update("connected");
    });
    current.addEventListener("close", disconnected);
    current.addEventListener("error", () => {
      if (socket !== current || stopped) return;

      report(new Error("Phoenixd WebSocket connection failed"));
      disconnected();
    });
    current.addEventListener("message", (event) => {
      if (socket !== current || stopped) return;

      try {
        if (typeof event.data !== "string")
          throw new Error("Expected a text payment notification");

        const value: unknown = JSON.parse(event.data);

        if (
          typeof value === "object" &&
          value !== null &&
          "type" in value &&
          value.type !== "payment_received"
        )
          return;

        if (!isPayment(value))
          throw new Error("Invalid Phoenixd payment notification");

        notify(() => options.onPayment(value));
      } catch {
        report(new Error("Invalid Phoenixd payment notification"));
      }
    });
  };

  const subscription: PaymentSubscription = {
    get status() {
      return status;
    },

    close,
  };

  if (options.signal?.aborted) close();
  else {
    options.signal?.addEventListener("abort", close, { once: true });
    // The caller receives the handle before any observer runs.
    queueMicrotask(connect);
  }

  return subscription;
}
