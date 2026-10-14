import { Phoenixd, HttpClientError } from "@nodana/phoenixd-ts";
import type { PaymentResult, DecodedInvoice } from "@nodana/phoenixd-ts";

const node = new Phoenixd("http://localhost:9740", "password");

const result: Promise<PaymentResult> = node.payInvoice({ invoice: "lnbc..." });

const invoice: Promise<DecodedInvoice> = node.decodeInvoice({
  invoice: "lnbc...",
});

void [result, invoice, HttpClientError];
