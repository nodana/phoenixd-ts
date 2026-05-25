# Phoenixd TypeScript Client

TypeScript client for phoenixd nodes with generated declaration files. Works in different JavaScript runtimes including Node.js and React Native.

## Installation

```bash
npm install @nodana/phoenixd-ts
```

## Getting Started

```ts
import { Phoenixd } from "@nodana/phoenixd-ts";
import type { NodeInfo } from "@nodana/phoenixd-ts";

const pxd = new Phoenixd(connectionUrl, password);

// async
const info: NodeInfo = await pxd.getInfo();
```

## Types

This package ships generated TypeScript declarations from the source.

```ts
import { Phoenixd } from "@nodana/phoenixd-ts";
import type {
  Balance,
  BumpFeeParams,
  Channel,
  ChannelCompact,
  ChannelUpdate,
  CloseChannelParams,
  Commitments,
  CreateInvoiceParams,
  CreateInvoiceResponse,
  CreateOfferParams,
  DecodeInvoiceParams,
  DecodeOfferParams,
  EstimateLiquidityFeesParams,
  ExportPaymentsParams,
  IncomingPayment,
  IncomingPaymentSubType,
  IncomingPaymentType,
  LiquidityFeesEstimate,
  ListChannelsResponse,
  ListIncomingPaymentsParams,
  ListOutgoingPaymentsParams,
  lnUrlAuthParams,
  lnUrlPayParams,
  LnUrlWithdrawal,
  lnUrlWithdrawParams,
  LocalParams,
  NodeInfo,
  OutgoingPayment,
  OutgoingPaymentSubType,
  OutgoingPaymentType,
  Payment,
  PayInvoiceParams,
  PayLnAddressParams,
  PayOfferParams,
  PhoenixdClient,
  RemoteParams,
  SendToAddressParams,
  WebsocketPayment,
} from "@nodana/phoenixd-ts";
```

Request and response types are exported from the package root. `WebsocketPayment`
is included as a type only; websocket connection management is left to consuming
applications.

## Methods

### Create Invoice

```ts
createInvoice({
  description,
  descriptionHash,
  amountSat,
  expirySeconds,
  externalId,
  webhookUrl,
});
```

### Pay Invoice

```ts
payInvoice({ invoice, amountSat, sendAll });
```

### Create Offer

```ts
createOffer({ description, amountSat });
```

### Pay Offer

```ts
payOffer({ offer, amountSat, sendAll, message });
```

### Pay Lightning Address

```ts
payLnAddress({ address, amountSat, sendAll, message });
```

### Send To Address

```ts
sendToAddress({ amountSat, address, feerateSatByte });
```

### Bump Fee

```ts
bumpFee({ feerateSatByte });
```

### List Incoming Payments

```ts
listIncomingPayments({ from, to, limit, offset, all, externalId });
```

### Get Incoming Payment

```ts
getIncomingPayment(paymentHash);
```

### List Outgoing Payments

```ts
listOutgoingPayments({ from, to, limit, offset, all });
```

### Get Outgoing Payment

```ts
getOutgoingPayment(paymentId);
```

### Get Outgoing Payment By Hash

```ts
getOutgoingPaymentByHash(paymentHash);
```

### Export Payments

```ts
exportPayments({ from, to });
```

### Get Client Info

```ts
getInfo();
```

### Get Balance

```ts
getBalance();
```

### Get Lightning Address

```ts
getLightningAddress();
```

### List Channels

```ts
listChannels();
```

### Close Channel

```ts
closeChannel({ channelId, address, feerateSatByte });
```

### Decode Invoice

```ts
decodeInvoice({ invoice });
```

### Decode Offer

```ts
decodeOffer({ offer });
```

### Estimate Liquidity Fees

```ts
estimateLiquidityFees({ amountSat });
```

### LN-URL Pay

```ts
lnUrlPay({ lnurl, amountSat, sendAll, message });
```

### LN-URL Withdraw

```ts
lnUrlWithdraw({ lnurl });
```

### LN-URL Auth

```ts
lnUrlAuth({ lnurl });
```

See https://phoenix.acinq.co/server/api for full API details.

## Contributing

Contributions to this project are welcomed:

1. Fork repo
2. Create feature branch
3. Create PR

I will review as soon as possible.
