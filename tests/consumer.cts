import client = require("@nodana/phoenixd-ts");

const node = new client.Phoenixd("http://localhost:9740", "password");

const result: Promise<client.PaymentResult> = node.payInvoice({
  invoice: "lnbc...",
});

void [result, client.HttpClientError];
