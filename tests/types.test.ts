import { it, expectTypeOf } from "vitest";
import type {
  Phoenixd,
  CreateInvoiceParams,
  PayInvoiceParams,
  PayLnAddressParams,
  PaymentResult,
  IncomingPayment,
  NodeInfo,
} from "../src";

// Compile-time regressions: these invalid combinations must remain invalid.
// @ts-expect-error Exactly one description is required.
const missingDescription: CreateInvoiceParams = {};

// @ts-expect-error Both forms of description are forbidden.
const bothDescriptions: CreateInvoiceParams = {
  description: "",
  descriptionHash: "hash",
};

const bothAmounts: PayInvoiceParams = {
  invoice: "invoice",
  amountSat: 1,
  // @ts-expect-error Sending all and a specified amount are mutually exclusive.
  sendAll: true,
};

// @ts-expect-error False still sends the parameter and therefore triggers send-all upstream.
const falseSendAll: PayInvoiceParams = { invoice: "invoice", sendAll: false };

// @ts-expect-error An address payment needs an amount.
const addressNoAmount: PayLnAddressParams = { address: "name@example.com" };

void [
  missingDescription,
  bothDescriptions,
  bothAmounts,
  falseSendAll,
  addressNoAmount,
];

it("publishes explicit method results and payment discriminators", () => {
  expectTypeOf<ReturnType<Phoenixd["payInvoice"]>>().toEqualTypeOf<
    Promise<PaymentResult>
  >();
  expectTypeOf<ReturnType<Phoenixd["getIncomingPayment"]>>().toEqualTypeOf<
    Promise<IncomingPayment | null>
  >();
  expectTypeOf<ReturnType<Phoenixd["getInfo"]>>().toEqualTypeOf<
    Promise<NodeInfo>
  >();

  const narrow = (result: PaymentResult) => {
    if (result.type === "payment_sent")
      expectTypeOf(result.paymentPreimage).toEqualTypeOf<string>();
    else expectTypeOf(result.reason).toEqualTypeOf<string>();
  };

  void narrow;
});
