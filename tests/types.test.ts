import type {
  Balance,
  CreateInvoiceResponse,
  IncomingPayment,
  OutgoingPayment,
  PhoenixdClient,
  WebsocketPayment,
} from "../src";

describe("public types", () => {
  it("should expose consumer-facing types from the package entrypoint", () => {
    const _client = null as unknown as PhoenixdClient;
    const _balance = null as unknown as Balance;
    const _invoice = null as unknown as CreateInvoiceResponse;
    const _incoming = null as unknown as IncomingPayment;
    const _outgoing = null as unknown as OutgoingPayment;
    const _websocket = null as unknown as WebsocketPayment;

    void _client;
    void _balance;
    void _invoice;
    void _incoming;
    void _outgoing;
    void _websocket;
  });
});
