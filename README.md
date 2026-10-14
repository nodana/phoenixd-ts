# @nodana/phoenixd-ts

A typed client for [Phoenixd](https://github.com/ACINQ/phoenixd). Create invoices and offers, send payments, inspect payment history and subscribe to incoming payments.

## Install and connect

Use Node.js 22 or later:

```sh
npm install @nodana/phoenixd-ts
```

```ts
import { Phoenixd } from "@nodana/phoenixd-ts";

const password = process.env.PHOENIXD_PASSWORD;
if (!password) throw new Error("Set PHOENIXD_PASSWORD");

const node = new Phoenixd("http://127.0.0.1:9740", password);
const balance = await node.getBalance();
console.log(balance.balanceSat);
```

Use your node's URL and a password. The full-access password is required to send payments, authenticate with LNURL, send on-chain funds, bump fees or close channels. The limited-access password can create invoices and offers, read node and payment information, withdraw through LNURL and receive payment notifications.

CommonJS works too:

```js
const { Phoenixd } = require("@nodana/phoenixd-ts");
```

## Receive a payment

```ts
const invoice = await node.createInvoice({
  amountSat: 1000,
  description: "Order 123",
  externalId: "order-123",
  expirySeconds: 3600,
});

// Give invoice.serialized to the payer.
const payment = await node.getIncomingPayment(invoice.paymentHash);
if (payment?.isPaid) {
  console.log(`Received ${payment.receivedSat} sats`);
}
```

Provide either `description` or `descriptionHash`. An empty description is allowed. Omit `amountSat` to let the payer choose an amount; the response's `amountSat` can then be absent. `expirySeconds` controls how long the invoice remains payable; Phoenixd defaults to one hour.

A payment lookup returns `null` when no matching payment exists. Check `isPaid` before fulfilling an order.

## Send a payment

```ts
const result = await node.payInvoice({ invoice: "lnbc..." });

if (result.type === "payment_sent") {
  console.log(result.paymentId, result.paymentPreimage);
} else {
  console.error(result.reason);
}
```

The result is a `PaymentResult` union. Check `type` to distinguish a successful payment from a rejected one, even when the HTTP request succeeds. `payOffer`, `payLnAddress` and `lnUrlPay` return the same union.

For an amountless invoice, supply `amountSat`. To send the available balance, use `sendAll: true` instead of `amountSat`.

```ts
await node.payInvoice({ invoice: "lnbc...", amountSat: 1000 });
await node.payLnAddress({ address: "name@example.com", amountSat: 1000 });
```

If a payment request times out or loses its connection, check outgoing payment history before trying again: the payment may already have completed.

## Use a reusable offer

```ts
const offer = await node.createOffer({ description: "Support this project" });
const result = await node.payOffer({ offer, amountSat: 1000 });
```

`getOffer()` returns your node's default offer. `decodeInvoice()` and `decodeOffer()` expose typed details you can inspect before paying.

## Watch incoming payments

On Node, the main import includes authenticated payment subscriptions:

```ts
const subscription = node.subscribePayments({
  onPayment(payment) {
    console.log(payment.paymentHash, payment.amountSat, payment.externalId);
  },
  onStatus(status) {
    console.log(status);
  },
  onError(error) {
    console.error(error.message);
  },
});

// When your application stops watching:
subscription.close();
```

Subscriptions reconnect automatically and stop after ten consecutive failed reconnect attempts. `onStatus` receives `connecting`, `connected`, `reconnecting` or `closed`. You can set `reconnect: false` or supply an `AbortSignal` to stop watching.

Notifications are live. After a reconnect, query `listIncomingPayments()` to catch payments received while disconnected. Process each payment hash once if you use notifications and history together.

## Query history and manage the node

```ts
const payments = await node.listIncomingPayments({
  from: new Date("2026-01-01"),
  limit: 50,
  offset: 0,
  externalId: "order-123",
});

const info = await node.getInfo();
const swapIn = await node.getSwapInAddress();
```

History filters accept `Date` or Unix milliseconds. Use `all: true` to include unpaid incoming invoices or failed outgoing payments. Advance `offset` to retrieve further pages.

| Task                                | Methods                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Receive Lightning payments          | `createInvoice`, `createOffer`, `getOffer`, `getLightningAddress`        |
| Send Lightning payments             | `payInvoice`, `payOffer`, `payLnAddress`, `lnUrlPay`                     |
| Look up incoming payments           | `listIncomingPayments`, `getIncomingPayment`                             |
| Look up outgoing payments           | `listOutgoingPayments`, `getOutgoingPayment`, `getOutgoingPaymentByHash` |
| Inspect the node                    | `getInfo`, `getBalance`, `getSwapInAddress`, `listChannels`              |
| Inspect payment requests            | `decodeInvoice`, `decodeOffer`                                           |
| Manage liquidity and channels       | `estimateLiquidityFees`, `sendToAddress`, `bumpFee`, `closeChannel`      |
| Withdraw or authenticate with LNURL | `lnUrlWithdraw`, `lnUrlAuth`                                             |
| Export payment history              | `exportPayments`                                                         |

`getInfo().channels` provides typed channel summaries. `listChannels()` returns full channel-state JSON for callers who need more detail.

Most amount fields use satoshis. History `fees`, decoded invoice `amount`, Bitcoin offer `amount`, and LNURL withdrawal bounds use **millisatoshis**. An offer's `currency` identifies amounts denominated in another currency.

`sendToAddress`, `bumpFee` and `closeChannel` return Phoenixd's text result. Read that result: it may describe a failure instead of containing a transaction ID. `exportPayments({ from, to })` writes CSV on the node's filesystem and returns a message with the export location.

## Cancel requests and handle errors

Every HTTP method accepts request options as its last argument:

```ts
import { HttpClientError } from "@nodana/phoenixd-ts";

try {
  const info = await node.getInfo({
    signal: AbortSignal.timeout(5000),
  });
} catch (error) {
  if (error instanceof HttpClientError) {
    console.error(error.status, error.body);
  } else {
    throw error;
  }
}
```

Set a default deadline with the third constructor argument:

```ts
const node = new Phoenixd(url, password, { timeoutMs: 30_000 });
await node.getBalance({ timeoutMs: 5000 });
```

There is no default deadline. Set `timeoutMs: 0` on a request to disable a configured deadline. Network and cancellation errors retain their platform error types; an invalid JSON response throws `PhoenixdResponseError`.

For HTTP 401, check the password and whether the operation needs full access. For HTTP 400, inspect `error.body` and check the request parameters. For a connection error, check the node URL and reachability.

## React Native and other fetch runtimes

The HTTP client uses standard `fetch` and has no Node imports. Use the portable entry point in React Native, browsers or other fetch runtimes:

```ts
import { Phoenixd } from "@nodana/phoenixd-ts/http";

const node = new Phoenixd(nodeUrl, password);
const balance = await node.getBalance();
```

You can pass a `fetch` implementation in the third constructor argument. Node 22 and 24 are tested; validate the HTTP client on your React Native version before shipping. Keep a node's full-access password on your backend when building an app for other users.

For payment subscriptions outside Node, supply an authenticated `webSocketFactory` compatible with your platform. The Node entry point supplies that adapter automatically.

## Development

See [development and migration notes](docs/development.md) and the [Phoenixd API coverage audit](docs/api-coverage.md).
