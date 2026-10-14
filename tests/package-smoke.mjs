import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { WebSocketServer } from "ws";
import * as esm from "@nodana/phoenixd-ts";
import * as portable from "@nodana/phoenixd-ts/http";
import { build } from "esbuild";

const cjs = createRequire(import.meta.url)("@nodana/phoenixd-ts");

for (const exports of [esm, cjs, portable]) {
  assert.equal(typeof exports.Phoenixd, "function");
  assert.equal(typeof exports.HttpClientError, "function");
}

const server = createServer(async (request, response) => {
  assert.equal(request.headers.authorization, "Basic OnBhc3N3b3Jk");

  if (request.url === "/api/getinfo") {
    response.setHeader("Content-Type", "application/json");
    response.end(
      JSON.stringify({
        nodeId: "node",
        channels: [],
        chain: "regtest",
        version: "0.9.2",
      }),
    );
  } else if (request.url === "/api/export?from=1000&to=2000") {
    assert.equal(request.method, "POST");

    let body = "";

    for await (const chunk of request) body += chunk;

    assert.equal(body, "");
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify("exported"));
  } else {
    response.statusCode = 404;
    response.end("Not found");
  }
});

// Phoenixd authenticates the requested protocol but does not negotiate one.
const sockets = new WebSocketServer({ server, handleProtocols: () => false });

const payment = {
  type: "payment_received",
  amountSat: 100,
  paymentHash: "hash",
  timestamp: 1000,
};

sockets.on("connection", (socket, request) => {
  assert.equal(request.url, "/api/websocket");
  assert.equal(request.headers.authorization, "Basic OnBhc3N3b3Jk");
  assert.equal(request.headers["sec-websocket-protocol"], undefined);
  socket.send(JSON.stringify(payment));
});

let subscription;

try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const url = `http://127.0.0.1:${server.address().port}/api`;

  for (const exports of [esm, cjs, portable]) {
    const node = new exports.Phoenixd(url, "password");

    assert.equal((await node.getInfo()).chain, "regtest");
    assert.equal(await node.getIncomingPayment("a".repeat(64)), null);
    assert.equal(
      await node.exportPayments({ from: 1000, to: new Date(2000) }),
      "exported",
    );
  }

  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("WebSocket smoke test timed out")),
      5000,
    );

    subscription = new esm.Phoenixd(url, "password").subscribePayments({
      reconnect: false,
      onPayment: (event) => {
        clearTimeout(timer);
        assert.deepEqual(event, payment);
        resolve();
      },
      onError: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
  });
} finally {
  subscription?.close();

  for (const socket of sockets.clients) socket.terminate();

  await new Promise((resolve) => sockets.close(resolve));
  await new Promise((resolve) => server.close(resolve));
}

const types = spawnSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "--noEmit",
    "--strict",
    "--skipLibCheck",
    "--target",
    "ES2022",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "tests/consumer.mts",
    "tests/consumer.cts",
    "tests/consumer.http.mts",
  ],
  { encoding: "utf8" },
);

assert.equal(types.status, 0, types.stdout + types.stderr);

const portableBundle = await build({
  entryPoints: ["dist/index.js"],
  bundle: true,
  platform: "browser",
  write: false,
  metafile: true,
});

assert.ok(
  Object.keys(portableBundle.metafile.inputs).every(
    (path) => !path.includes("node_modules/ws"),
  ),
);

console.log(
  "ESM, CommonJS, NodeNext declarations and live HTTP/WebSocket smoke checks passed.",
);
