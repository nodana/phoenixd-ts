import { describe, expect, it, vi } from "vitest";
import { Phoenixd } from "../src";
import type {
  Balance,
  CreateInvoiceResponse,
  DecodedInvoice,
  DecodedOffer,
  IncomingPayment,
  NodeInfo,
  OutgoingPayment,
} from "../src";

// Nullable fields are omitted by Phoenixd's explicitNulls=false serializers.
const invoice = {
  paymentHash: "hash",
  serialized: "lnbc...",
} satisfies CreateInvoiceResponse;

const info = {
  nodeId: "node",
  chain: "regtest",
  channels: [{ state: "WaitForOpenChannel" }],
  version: "0.9.2",
} satisfies NodeInfo;

const balance = {
  balanceSat: 0,
  feeCreditSat: 0,
  swapIn: {
    unconfirmedBalanceSat: 1000,
    weaklyConfirmedBalanceSat: 0,
    deeplyConfirmedBalanceSat: 0,
  },
} satisfies Balance;

const incoming = {
  type: "incoming_payment",
  subType: "lightning",
  paymentHash: "hash",
  preimage: "preimage",
  isPaid: false,
  isExpired: false,
  receivedSat: 0,
  fees: 0,
  createdAt: 1000,
} satisfies IncomingPayment;

const outgoing = {
  type: "outgoing_payment",
  subType: "splice_out",
  paymentId: "id",
  txId: "txid",
  isPaid: true,
  sent: 1000,
  fees: 1500,
  createdAt: 1000,
  completedAt: 2000,
} satisfies OutgoingPayment;

const decodedInvoice = {
  chain: "regtest",
  paymentHash: "hash",
  paymentSecret: "secret",
  extraHops: [],
  timestampSeconds: 1,
} satisfies DecodedInvoice;

const decodedOffer = {
  chain: "regtest",
  description: "Support this project",
} satisfies DecodedOffer;

describe("upstream response shapes", () => {
  it("accepts omitted nullable fields and preserves units and subtype information", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();

    for (const response of [
      invoice,
      info,
      balance,
      incoming,
      outgoing,
      decodedInvoice,
      decodedOffer,
    ])
      fetch.mockResolvedValueOnce(Response.json(response));

    const node = new Phoenixd("http://localhost:9740", "password", { fetch });

    expect(await node.createInvoice({ description: "" })).toEqual(invoice);
    expect(await node.getInfo()).toEqual(info);
    expect(await node.getBalance()).toEqual(balance);
    expect(await node.getIncomingPayment("hash")).toEqual(incoming);
    expect(await node.getOutgoingPayment("id")).toEqual(outgoing);
    expect(await node.decodeInvoice({ invoice: "lnbc..." })).toEqual(
      decodedInvoice,
    );
    expect(await node.decodeOffer({ offer: "lno..." })).toEqual(decodedOffer);
  });
});
