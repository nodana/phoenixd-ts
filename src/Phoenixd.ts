import { HttpClient } from "./HttpClient";
import { subscribePayments } from "./subscriptions";
import type * as T from "./types";
import type {
  PaymentSubscription,
  PaymentSubscriptionOptions,
} from "./subscriptions";

export class Phoenixd implements T.PhoenixdClient {
  readonly #http: HttpClient;
  readonly #password: string;

  constructor(
    public readonly url: string,
    password: string,
    options: T.PhoenixdOptions = {},
  ) {
    this.#password = password;
    this.#http = new HttpClient(url, password, options);
  }

  async createInvoice(
    params: T.CreateInvoiceParams,
    options?: T.RequestOptions,
  ): Promise<T.CreateInvoiceResponse> {
    if (
      (params.description !== undefined) ===
      (params.descriptionHash !== undefined)
    )
      throw new TypeError(
        "Provide exactly one of description or descriptionHash",
      );

    return this.#http.request("POST", "createinvoice", params, options);
  }

  async payInvoice(
    params: T.PayInvoiceParams,
    options?: T.RequestOptions,
  ): Promise<T.PaymentResult> {
    if (params.amountSat !== undefined && params.sendAll !== undefined)
      throw new TypeError("amountSat and sendAll are mutually exclusive");

    if (params.sendAll !== undefined && params.sendAll !== true)
      throw new TypeError("sendAll must be true");

    return this.#http.request("POST", "payinvoice", params, options);
  }

  async createOffer(
    params?: T.CreateOfferParams,
    options?: T.RequestOptions,
  ): Promise<string> {
    if (params?.amountSat !== undefined && params.description === undefined)
      throw new TypeError("An offer with an amount requires a description");

    return this.#http.request("POST", "createoffer", params, options, {
      text: true,
    });
  }

  async payOffer(
    params: T.PayOfferParams,
    options?: T.RequestOptions,
  ): Promise<T.PaymentResult> {
    if (params.amountSat !== undefined && params.sendAll !== undefined)
      throw new TypeError("amountSat and sendAll are mutually exclusive");

    if (params.sendAll !== undefined && params.sendAll !== true)
      throw new TypeError("sendAll must be true");

    return this.#http.request("POST", "payoffer", params, options);
  }

  async payLnAddress(
    params: T.PayLnAddressParams,
    options?: T.RequestOptions,
  ): Promise<T.PaymentResult> {
    if (params.amountSat !== undefined && params.sendAll !== undefined)
      throw new TypeError("amountSat and sendAll are mutually exclusive");

    if (params.sendAll !== undefined && params.sendAll !== true)
      throw new TypeError("sendAll must be true");

    if (params.amountSat === undefined && params.sendAll !== true)
      throw new TypeError("Provide amountSat or sendAll");

    return this.#http.request("POST", "paylnaddress", params, options);
  }

  async sendToAddress(
    params: T.SendToAddressParams,
    options?: T.RequestOptions,
  ): Promise<string> {
    return this.#http.request("POST", "sendtoaddress", params, options, {
      text: true,
    });
  }

  async bumpFee(
    params: T.BumpFeeParams,
    options?: T.RequestOptions,
  ): Promise<string> {
    return this.#http.request("POST", "bumpfee", params, options, {
      text: true,
    });
  }

  async closeChannel(
    params: T.CloseChannelParams,
    options?: T.RequestOptions,
  ): Promise<string> {
    return this.#http.request("POST", "closechannel", params, options, {
      text: true,
    });
  }

  async listIncomingPayments(
    params?: T.ListIncomingPaymentsParams,
    options?: T.RequestOptions,
  ): Promise<T.IncomingPayment[]> {
    return this.#http.request("GET", "payments/incoming", params, options);
  }

  async listOutgoingPayments(
    params?: T.ListOutgoingPaymentsParams,
    options?: T.RequestOptions,
  ): Promise<T.OutgoingPayment[]> {
    return this.#http.request("GET", "payments/outgoing", params, options);
  }

  async exportPayments(
    params?: T.ExportPaymentsParams,
    options?: T.RequestOptions,
  ): Promise<string> {
    return this.#http.request("POST", "export", params, options, {
      query: true,
      text: true,
    });
  }

  async getInfo(options?: T.RequestOptions): Promise<T.NodeInfo> {
    return this.#http.request("GET", "getinfo", {}, options);
  }

  async getBalance(options?: T.RequestOptions): Promise<T.Balance> {
    return this.#http.request("GET", "getbalance", {}, options);
  }

  async getLightningAddress(options?: T.RequestOptions): Promise<string> {
    return this.#http.request("GET", "getlnaddress", {}, options, {
      text: true,
    });
  }

  async getOffer(options?: T.RequestOptions): Promise<string> {
    return this.#http.request("GET", "getoffer", {}, options, { text: true });
  }

  async getSwapInAddress(options?: T.RequestOptions): Promise<T.SwapInAddress> {
    return this.#http.request("GET", "getswapinaddress", {}, options);
  }

  async listChannels(
    options?: T.RequestOptions,
  ): Promise<T.ListChannelsResponse> {
    return this.#http.request("GET", "listchannels", {}, options);
  }

  async decodeInvoice(
    params: T.DecodeInvoiceParams,
    options?: T.RequestOptions,
  ): Promise<T.DecodedInvoice> {
    return this.#http.request("POST", "decodeinvoice", params, options);
  }

  async decodeOffer(
    params: T.DecodeOfferParams,
    options?: T.RequestOptions,
  ): Promise<T.DecodedOffer> {
    return this.#http.request("POST", "decodeoffer", params, options);
  }

  async estimateLiquidityFees(
    params: T.EstimateLiquidityFeesParams,
    options?: T.RequestOptions,
  ): Promise<T.LiquidityFeesEstimate> {
    return this.#http.request("GET", "estimateliquidityfees", params, options);
  }

  async lnUrlPay(
    params: T.LnUrlPayParams,
    options?: T.RequestOptions,
  ): Promise<T.PaymentResult> {
    if (params.amountSat !== undefined && params.sendAll !== undefined)
      throw new TypeError("amountSat and sendAll are mutually exclusive");

    if (params.sendAll !== undefined && params.sendAll !== true)
      throw new TypeError("sendAll must be true");

    return this.#http.request("POST", "lnurlpay", params, options);
  }

  async lnUrlWithdraw(
    params: T.LnUrlWithdrawParams,
    options?: T.RequestOptions,
  ): Promise<T.LnUrlWithdrawal> {
    return this.#http.request("POST", "lnurlwithdraw", params, options);
  }

  async lnUrlAuth(
    params: T.LnUrlAuthParams,
    options?: T.RequestOptions,
  ): Promise<string> {
    return this.#http.request("POST", "lnurlauth", params, options, {
      text: true,
    });
  }

  async getIncomingPayment(
    id: string,
    options?: T.RequestOptions,
  ): Promise<T.IncomingPayment | null> {
    return this.#http.request(
      "GET",
      `payments/incoming/${encodeURIComponent(id)}`,
      {},
      options,
      { missing: true },
    );
  }

  async getOutgoingPayment(
    id: string,
    options?: T.RequestOptions,
  ): Promise<T.OutgoingPayment | null> {
    return this.#http.request(
      "GET",
      `payments/outgoing/${encodeURIComponent(id)}`,
      {},
      options,
      { missing: true },
    );
  }

  async getOutgoingPaymentByHash(
    id: string,
    options?: T.RequestOptions,
  ): Promise<T.OutgoingPayment | null> {
    return this.#http.request(
      "GET",
      `payments/outgoingbyhash/${encodeURIComponent(id)}`,
      {},
      options,
      { missing: true },
    );
  }

  subscribePayments(options: PaymentSubscriptionOptions): PaymentSubscription {
    return subscribePayments(this.url, this.#password, options);
  }
}
