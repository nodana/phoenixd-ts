# Phoenixd API coverage

Audited against [Phoenixd v0.9.2 routes](https://github.com/ACINQ/phoenixd/blob/v0.9.2/src/commonMain/kotlin/fr/acinq/phoenixd/Api.kt), [Phoenixd response serializers](https://github.com/ACINQ/phoenixd/blob/v0.9.2/src/commonMain/kotlin/fr/acinq/phoenixd/json/JsonSerializers.kt) and [lightning-kmp v1.13.2 serializers](https://github.com/ACINQ/lightning-kmp/blob/v1.13.2/modules/core/src/commonMain/kotlin/fr/acinq/lightning/json/JsonSerializers.kt).

All 26 authenticated HTTP endpoints and the incoming-payment WebSocket are exposed. “Either” means the full or limited password; “Full” requires full access.

| Endpoint                                 | Method | Access | Client method              | Result                       |
| ---------------------------------------- | ------ | ------ | -------------------------- | ---------------------------- |
| `/getinfo`                               | GET    | Either | `getInfo`                  | `NodeInfo`                   |
| `/getbalance`                            | GET    | Either | `getBalance`               | `Balance`                    |
| `/getoffer`                              | GET    | Either | `getOffer`                 | string                       |
| `/getlnaddress`                          | GET    | Either | `getLightningAddress`      | string                       |
| `/getswapinaddress`                      | GET    | Either | `getSwapInAddress`         | `SwapInAddress`              |
| `/listchannels`                          | GET    | Either | `listChannels`             | `JsonObject[]`               |
| `/estimateliquidityfees`                 | GET    | Either | `estimateLiquidityFees`    | `LiquidityFeesEstimate`      |
| `/payments/incoming`                     | GET    | Either | `listIncomingPayments`     | `IncomingPayment[]`          |
| `/payments/incoming/{paymentHash}`       | GET    | Either | `getIncomingPayment`       | `IncomingPayment \| null`    |
| `/payments/outgoing`                     | GET    | Either | `listOutgoingPayments`     | `OutgoingPayment[]`          |
| `/payments/outgoing/{uuid}`              | GET    | Either | `getOutgoingPayment`       | `OutgoingPayment \| null`    |
| `/payments/outgoingbyhash/{paymentHash}` | GET    | Either | `getOutgoingPaymentByHash` | `OutgoingPayment \| null`    |
| `/createinvoice`                         | POST   | Either | `createInvoice`            | `CreateInvoiceResponse`      |
| `/createoffer`                           | POST   | Either | `createOffer`              | string                       |
| `/payinvoice`                            | POST   | Full   | `payInvoice`               | `PaymentResult`              |
| `/payoffer`                              | POST   | Full   | `payOffer`                 | `PaymentResult`              |
| `/paylnaddress`                          | POST   | Full   | `payLnAddress`             | `PaymentResult`              |
| `/decodeinvoice`                         | POST   | Either | `decodeInvoice`            | `DecodedInvoice`             |
| `/decodeoffer`                           | POST   | Either | `decodeOffer`              | `DecodedOffer`               |
| `/lnurlpay`                              | POST   | Full   | `lnUrlPay`                 | `PaymentResult`              |
| `/lnurlwithdraw`                         | POST   | Either | `lnUrlWithdraw`            | `LnUrlWithdrawal`            |
| `/lnurlauth`                             | POST   | Full   | `lnUrlAuth`                | string                       |
| `/sendtoaddress`                         | POST   | Full   | `sendToAddress`            | text result                  |
| `/bumpfee`                               | POST   | Full   | `bumpFee`                  | text result                  |
| `/closechannel`                          | POST   | Full   | `closeChannel`             | text result                  |
| `/export`                                | POST   | Either | `exportPayments`           | string                       |
| `/websocket`                             | WS     | Either | `subscribePayments`        | `WebsocketPayment` callbacks |

POST arguments use form bodies except `/export`, whose date filters belong in the query string. History/export date filters accept Unix milliseconds; the client also converts `Date`. Hashes and IDs are escaped as path segments.

The source route returns NoContent for missing lookups, but its StatusPages handler converts that to 404. Both forms map to null to cover deployed versions. A 404 from any other route remains an HTTP error.

Phoenixd disables explicit null serialization. Optional nullable fields therefore include `undefined` and `null`, including amountless invoice amounts, swap-in balances and absent payment metadata. Channel summaries without commitments may contain only their state. Node information includes chain, version and an optional block height. Outgoing payment subtypes include all six cases emitted by the tagged source.

Payment attempts return `payment_sent` or `payment_failed` even with HTTP 200. On-chain actions can likewise return a failure message with HTTP 200, so their results remain strings. Lightning address lookups can return an explanatory string instead of an address. Exports write a CSV on the daemon filesystem; the response is not a CSV download.

Decoded invoice/offer scalar fields are typed from upstream serializers. Routing hints, blinded routes, unknown tags/TLVs and full channel states retain recursive JSON types rather than pretending to model all lightning-kmp internals. The typed channel summary from `getInfo` supports ordinary balance/capacity inspection.

Tests use serializer-derived response shapes and a loopback HTTP/WebSocket server. No live Phoenixd node or funded wallet was exercised. Recheck the tagged routes and serializers on each Phoenixd upgrade.
