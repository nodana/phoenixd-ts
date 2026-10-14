import { describe, it, expect, vi } from "vitest";
import { Phoenixd } from "../src";
import type {
  CreateInvoiceParams,
  PayInvoiceParams,
  PayLnAddressParams,
} from "../src";

describe("Phoenixd endpoint coverage", () => {
  const routes: [
    string,
    "GET" | "POST",
    (node: Phoenixd) => Promise<unknown>,
  ][] = [
    ["getinfo", "GET", (n) => n.getInfo()],
    ["getbalance", "GET", (n) => n.getBalance()],
    ["getoffer", "GET", (n) => n.getOffer()],
    ["getlnaddress", "GET", (n) => n.getLightningAddress()],
    ["getswapinaddress", "GET", (n) => n.getSwapInAddress()],
    ["listchannels", "GET", (n) => n.listChannels()],
    [
      "estimateliquidityfees",
      "GET",
      (n) => n.estimateLiquidityFees({ amountSat: 1000 }),
    ],
    [
      "payments/incoming",
      "GET",
      (n) => n.listIncomingPayments({ all: false, offset: 0 }),
    ],
    ["payments/outgoing", "GET", (n) => n.listOutgoingPayments()],
    ["payments/incoming/hash", "GET", (n) => n.getIncomingPayment("hash")],
    ["payments/outgoing/id", "GET", (n) => n.getOutgoingPayment("id")],
    [
      "payments/outgoingbyhash/hash",
      "GET",
      (n) => n.getOutgoingPaymentByHash("hash"),
    ],
    [
      "createinvoice",
      "POST",
      (n) => n.createInvoice({ descriptionHash: "a".repeat(64) }),
    ],
    ["createoffer", "POST", (n) => n.createOffer()],
    ["payinvoice", "POST", (n) => n.payInvoice({ invoice: "lnbc..." })],
    ["payoffer", "POST", (n) => n.payOffer({ offer: "lno..." })],
    [
      "paylnaddress",
      "POST",
      (n) => n.payLnAddress({ address: "name@example.com", sendAll: true }),
    ],
    [
      "sendtoaddress",
      "POST",
      (n) =>
        n.sendToAddress({
          address: "bc1...",
          amountSat: 1000,
          feerateSatByte: 3,
        }),
    ],
    ["bumpfee", "POST", (n) => n.bumpFee({ feerateSatByte: 3 })],
    [
      "closechannel",
      "POST",
      (n) =>
        n.closeChannel({
          channelId: "id",
          address: "bc1...",
          feerateSatByte: 3,
        }),
    ],
    ["decodeinvoice", "POST", (n) => n.decodeInvoice({ invoice: "lnbc..." })],
    ["decodeoffer", "POST", (n) => n.decodeOffer({ offer: "lno..." })],
    ["lnurlpay", "POST", (n) => n.lnUrlPay({ lnurl: "lnurl..." })],
    ["lnurlwithdraw", "POST", (n) => n.lnUrlWithdraw({ lnurl: "lnurl..." })],
    ["lnurlauth", "POST", (n) => n.lnUrlAuth({ lnurl: "lnurl..." })],
    ["export", "POST", (n) => n.exportPayments()],
  ];

  it.each(routes)("%s uses %s", async (route, method, call) => {
    const textRoutes = new Set([
      "getoffer",
      "getlnaddress",
      "createoffer",
      "sendtoaddress",
      "bumpfee",
      "closechannel",
      "lnurlauth",
      "export",
    ]);
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(Response.json(textRoutes.has(route) ? "result" : {}));

    await call(new Phoenixd("http://localhost:9740/", "password", { fetch }));

    const [url, init] = fetch.mock.calls[0]!;

    expect(new URL(String(url)).pathname).toBe("/" + route);
    expect(init?.method).toBe(method);
  });

  it("rejects ambiguous amounts and descriptions before sending a request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const node = new Phoenixd("http://localhost:9740", "password", { fetch });

    await expect(node.createInvoice({} as CreateInvoiceParams)).rejects.toThrow(
      "exactly one",
    );
    await expect(
      node.createInvoice({
        description: "",
        descriptionHash: "hash",
      } as unknown as CreateInvoiceParams),
    ).rejects.toThrow("exactly one");
    await expect(
      node.payInvoice({
        invoice: "invoice",
        amountSat: 100,
        sendAll: true,
      } as unknown as PayInvoiceParams),
    ).rejects.toThrow("mutually exclusive");
    await expect(
      node.payInvoice({
        invoice: "invoice",
        sendAll: false,
      } as unknown as PayInvoiceParams),
    ).rejects.toThrow("sendAll must be true");
    await expect(
      node.payLnAddress({ address: "address" } as PayLnAddressParams),
    ).rejects.toThrow("Provide amountSat");
    await expect(node.createOffer({ amountSat: 100 })).rejects.toThrow(
      "requires a description",
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
