import { HttpClient, IHttpClient } from "./HttpClient";
import type {
  PhoenixdClient,
  CreateInvoiceParams,
  CreateOfferParams,
  PayInvoiceParams,
  PayOfferParams,
  CloseChannelParams,
  BumpFeeParams,
  ExportPaymentsParams,
  EstimateLiquidityFeesParams,
  PayLnAddressParams,
  SendToAddressParams,
  ListIncomingPaymentsParams,
  ListOutgoingPaymentsParams,
  DecodeInvoiceParams,
  DecodeOfferParams,
  lnUrlPayParams,
  lnUrlWithdrawParams,
  lnUrlAuthParams,
} from "./types";

export class Phoenixd implements PhoenixdClient {
  url: string;
  password: string;
  private _httpClient: IHttpClient;

  public constructor(url: string, password: string) {
    this.url = url;
    this.password = password;
    this._httpClient = new HttpClient(url, password);
  }

  public async createInvoice(params: CreateInvoiceParams) {
    if (!params.description && !params.descriptionHash) {
      console.info(
        "Either 'description' or 'descriptionHash' must be provided"
      );
      return;
    }

    return this._httpClient.post("/createinvoice", params);
  }

  public async payInvoice(params: PayInvoiceParams) {
    return this._httpClient.post("/payinvoice", params);
  }

  public async createOffer(params?: CreateOfferParams) {
    return this._httpClient.post("/createoffer", params ?? {});
  }

  public async payOffer(params: PayOfferParams) {
    return this._httpClient.post("/payoffer", params);
  }

  public async payLnAddress(params: PayLnAddressParams) {
    return this._httpClient.post("/paylnaddress", params);
  }

  public async sendToAddress(params: SendToAddressParams) {
    return this._httpClient.post("/sendtoaddress", params);
  }

  public async bumpFee(params: BumpFeeParams) {
    return this._httpClient.post("/bumpfee", params);
  }

  public async listIncomingPayments(params?: ListIncomingPaymentsParams) {
    let path = "/payments/incoming";

    if (params) {
      const qs = this._toQueryString(params);
      path += `?${qs}`;
    }

    return this._httpClient.get(path);
  }

  public async getIncomingPayment(paymentHash: string) {
    return this._httpClient.get(`/payments/incoming/${paymentHash}`);
  }

  public async listOutgoingPayments(params?: ListOutgoingPaymentsParams) {
    let path = "/payments/outgoing";

    if (params) {
      const qs = this._toQueryString(params);
      path += `?${qs}`;
    }

    return this._httpClient.get(path);
  }

  public async getOutgoingPayment(paymentId: string) {
    return this._httpClient.get(`/payments/outgoing/${paymentId}`);
  }

  public async getOutgoingPaymentByHash(paymentHash: string) {
    return this._httpClient.get(`/payments/outgoingbyhash/${paymentHash}`);
  }

  public async exportPayments(params?: ExportPaymentsParams) {
    return this._httpClient.post("/export", params ?? {});
  }

  public async getInfo() {
    return this._httpClient.get("/getinfo");
  }

  public async getBalance() {
    return this._httpClient.get("/getbalance");
  }

  public async getLightningAddress() {
    return this._httpClient.get("/getlnaddress");
  }

  public async listChannels() {
    return this._httpClient.get("/listchannels");
  }

  public async closeChannel(params: CloseChannelParams) {
    return this._httpClient.post("/closechannel", params);
  }

  public async decodeInvoice(params: DecodeInvoiceParams) {
    return this._httpClient.post("/decodeinvoice", params);
  }

  public async decodeOffer(params: DecodeOfferParams) {
    return this._httpClient.post("/decodeoffer", params);
  }

  public async estimateLiquidityFees(params: EstimateLiquidityFeesParams) {
    const qs = this._toQueryString(params);
    return this._httpClient.get(`/estimateliquidityfees?${qs}`);
  }

  public async lnUrlPay(params: lnUrlPayParams) {
    return this._httpClient.post("/lnurlpay", params);
  }

  public async lnUrlWithdraw(params: lnUrlWithdrawParams) {
    return this._httpClient.post("/lnurlwithdraw", params);
  }

  public async lnUrlAuth(params: lnUrlAuthParams) {
    return this._httpClient.post("/lnurlauth", params);
  }

  private _toQueryString(params: Record<string, any>) {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      searchParams.append(
        key,
        value instanceof Date ? value.getTime().toString() : String(value)
      );
    });

    return searchParams.toString();
  }
}
