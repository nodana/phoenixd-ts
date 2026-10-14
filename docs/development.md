# Development

Use Node 22 or 24. Install dependencies with `npm ci`, then run `npm test`. This checks source and test types, unit tests, both module builds, ESM/CommonJS consumer declarations and HTTP/WebSocket behaviour against a temporary loopback server. It does not send funds or require a live Phoenixd node.

## Runtime structure

`src/Phoenixd.ts` contains the portable HTTP API. `src/HttpClient.ts` handles authentication, form/query encoding, response parsing, cancellation and deadlines. The portable entry point imports no Node modules.

The main package export selects `src/node.ts` under Node's `node` resolution condition. This entry adds a `ws` adapter for Basic-authenticated subscriptions. Other runtimes receive the portable entry point; `/http` selects it explicitly and `/node` selects the Node adapter explicitly. Keep Node imports out of the portable dependency graph.

Phoenixd accepts its password as a WebSocket subprotocol but does not negotiate that protocol back. Node's native WebSocket rejects that handshake, so the Node adapter uses an Authorization header instead. Custom socket factories receive the WebSocket URL and password; they must establish an authenticated connection.

## Requests and subscriptions

HTTP requests never retry automatically and reject redirects. An aborted request does not tell the caller whether Phoenixd executed it. Preserve native network and cancellation errors. `HttpClientError` exposes status and response text; its message omits the body. `PhoenixdResponseError` exposes an invalid response body for diagnosis. Types describe the upstream contract; HTTP payloads are not schema-validated at runtime.

Configured and per-request abort signals both apply to requests. A per-request `timeoutMs` overrides the default; 0 disables it. The deadline remains active while reading the response body, and timers/listeners are removed on settlement.

Subscriptions connect asynchronously after returning a handle. They validate incoming payment events, ignore future event types, report handler failures and ignore events from superseded sockets. Each failed connection waits an exponentially increasing delay, capped at 30 seconds. A successful open resets the retry count. The connection deadline defaults to 10 seconds; ten consecutive reconnect attempts are allowed by default. Closing or aborting stops pending connections/reconnects. There is no event replay or automatic history reconciliation. Payment callbacks can run concurrently when they return promises; callers own application state and deduplication.

## Migrating from 0.1.3

This refresh retains `new Phoenixd(url, password)` and the existing HTTP method names. Corrected types and behaviour require callers to review the following:

- Payment methods return `PaymentResult`; narrow `type` before accessing success-only fields.
- Payment lookups return `null` for both HTTP 204 and 404. Other routes still throw HTTP errors for 404.
- Invoice creation requires exactly one description form and rejects invalid input instead of logging and returning undefined. Empty descriptions are valid.
- `amountSat` and `sendAll` are mutually exclusive. Only `sendAll: true` is accepted; Phoenixd interprets the parameter's presence as send-all even if its value is false.
- Lightning address payments require an amount or send-all.
- Nullable response fields can be omitted by Phoenixd's serializer. Types permit absence and null.
- Decoded invoice and offer results have named types. Full channel states use `JsonObject` rather than incomplete commitment internals. The previous `LocalParams`, `RemoteParams`, `Commitments` and `ChannelUpdate` declarations are removed.
- `url` is readonly and the password is private. Construct a new client to change credentials or nodes.
- Import errors from the package root. Legacy lowercase `lnUrl*Params` type names remain deprecated aliases.
- The supported Node baseline is 22. Portable HTTP callers can use `/http`; non-Node subscription callers provide a socket factory.

The next package version is 0.2.0, reflecting these API corrections. It has not been published. Release it before publishing packages that require the modernised client.
