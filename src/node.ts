import WebSocket from "ws";
import { Phoenixd as PortablePhoenixd } from "./Phoenixd";
import { base64Encode } from "./utils";
import type {
  PaymentSubscription,
  PaymentSubscriptionOptions,
} from "./subscriptions";

/** Node entry point adds authenticated payment subscriptions to the portable HTTP client. */
export class Phoenixd extends PortablePhoenixd {
  override subscribePayments(
    options: PaymentSubscriptionOptions,
  ): PaymentSubscription {
    return super.subscribePayments({
      ...options,
      webSocketFactory:
        options.webSocketFactory ??
        ((url, password) => {
          const socket = new WebSocket(url, {
            headers: { Authorization: `Basic ${base64Encode(`:${password}`)}` },
            followRedirects: false,
          });

          return {
            addEventListener: socket.addEventListener.bind(socket),
            close: () => socket.terminate(),
          };
        }),
    });
  }
}

export { HttpClientError, PhoenixdResponseError } from "./HttpClient";
export type * from "./types";
export type {
  PaymentSubscription,
  PaymentSubscriptionOptions,
  SubscriptionStatus,
  PaymentSocket,
} from "./subscriptions";
