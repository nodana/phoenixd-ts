/** Dates are Unix timestamps in milliseconds unless a field says otherwise. */
export type Timestamp = Date | number;

export type JsonValue =
  string | number | boolean | null | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface RequestOptions {
  signal?: AbortSignal;
  /** Request deadline in milliseconds. 0 disables the configured deadline. */
  timeoutMs?: number;
}

export interface PhoenixdOptions extends RequestOptions {
  /** Use a platform fetch implementation or instrument requests. */
  fetch?: typeof globalThis.fetch;
}

/** Select an amount, empty the wallet, or use the invoice/offer amount. */
export type PaymentAmount =
  | { amountSat: number; sendAll?: never }
  | { amountSat?: never; sendAll: true }
  | { amountSat?: never; sendAll?: never };

export type RequiredPaymentAmount = Exclude<
  PaymentAmount,
  { amountSat?: never; sendAll?: never }
>;

export type CreateInvoiceParams = {
  amountSat?: number;
  expirySeconds?: number;
  externalId?: string;
  webhookUrl?: string;
} & (
  | { description: string; descriptionHash?: never }
  | { description?: never; descriptionHash: string }
);

export interface CreateOfferParams {
  description?: string;
  amountSat?: number;
}

export type PayInvoiceParams = { invoice: string } & PaymentAmount;

export type PayOfferParams = {
  offer: string;
  message?: string;
} & PaymentAmount;

export type PayLnAddressParams = {
  address: string;
  message?: string;
} & RequiredPaymentAmount;

export type LnUrlPayParams = {
  lnurl: string;
  message?: string;
} & PaymentAmount;

export interface LnUrlWithdrawParams {
  lnurl: string;
}

export interface LnUrlAuthParams {
  lnurl: string;
}

/** @deprecated Use LnUrlPayParams. */
export type lnUrlPayParams = LnUrlPayParams;

/** @deprecated Use LnUrlWithdrawParams. */
export type lnUrlWithdrawParams = LnUrlWithdrawParams;

/** @deprecated Use LnUrlAuthParams. */
export type lnUrlAuthParams = LnUrlAuthParams;

export interface SendToAddressParams {
  amountSat: number;
  address: string;
  feerateSatByte: number;
}

export interface BumpFeeParams {
  feerateSatByte: number;
}

export interface CloseChannelParams extends BumpFeeParams {
  channelId: string;
  address: string;
}

export interface ExportPaymentsParams {
  from?: Timestamp;
  to?: Timestamp;
}

export interface ListOutgoingPaymentsParams extends ExportPaymentsParams {
  limit?: number;
  offset?: number;
  /** Include failed outgoing payments. */
  all?: boolean;
}

export interface ListIncomingPaymentsParams extends ExportPaymentsParams {
  limit?: number;
  offset?: number;
  /** Include unpaid invoices. */
  all?: boolean;
  externalId?: string;
}

export interface DecodeInvoiceParams {
  invoice: string;
}

export interface DecodeOfferParams {
  offer: string;
}

export interface EstimateLiquidityFeesParams {
  amountSat: number;
}

export interface CreateInvoiceResponse {
  amountSat?: number | null;
  paymentHash: string;
  serialized: string;
}

export interface Payment {
  type: "payment_sent";
  recipientAmountSat: number;
  routingFeeSat: number;
  paymentId: string;
  paymentHash: string;
  paymentPreimage: string;
}

export type PaymentSent = Payment;

export interface PaymentFailed {
  type: "payment_failed";
  paymentHash?: string | null;
  offerId?: string | null;
  reason: string;
}

/** Phoenixd can report payment_failed with HTTP 200. */
export type PaymentResult = Payment | PaymentFailed;

export interface ChannelCompact {
  state: string;
  channelId?: string | null;
  balanceSat?: number | null;
  inboundLiquiditySat?: number | null;
  capacitySat?: number | null;
  fundingTxId?: string | null;
}

/** Full channel state is upstream JSON. Use getInfo().channels for typed summaries. */
export type Channel = JsonObject;

export type ListChannelsResponse = Channel[];

export interface NodeInfo {
  nodeId: string;
  channels: ChannelCompact[];
  chain: string;
  blockHeight?: number | null;
  version: string;
}

export interface SwapInBalance {
  unconfirmedBalanceSat: number;
  weaklyConfirmedBalanceSat: number;
  deeplyConfirmedBalanceSat: number;
}

export interface Balance {
  balanceSat: number;
  feeCreditSat: number;
  swapIn?: SwapInBalance | null;
}

export interface SwapInAddress {
  address: string;
  index: number;
}

export interface LiquidityFeesEstimate {
  miningFeeSat: number;
  serviceFeeSat: number;
}

export type IncomingPaymentType = "incoming_payment";

export type IncomingPaymentSubType = "lightning";

export interface IncomingPayment {
  type: IncomingPaymentType;
  subType: IncomingPaymentSubType;
  paymentHash: string;
  preimage: string;
  externalId?: string | null;
  description?: string | null;
  invoice?: string | null;
  isPaid: boolean;
  isExpired: boolean;
  requestedSat?: number | null;
  receivedSat: number;
  /** Fees in millisatoshis. */
  fees: number;
  payerNote?: string | null;
  payerKey?: string | null;
  expiresAt?: number | null;
  completedAt?: number | null;
  createdAt: number;
}

export type OutgoingPaymentType = "outgoing_payment";

export type OutgoingPaymentSubType =
  | "lightning"
  | "auto_liquidity"
  | "manual_liquidity"
  | "splice_out"
  | "splice_cpfp"
  | "channel_close";

export interface OutgoingPayment {
  type: OutgoingPaymentType;
  subType: OutgoingPaymentSubType;
  paymentId: string;
  paymentHash?: string | null;
  preimage?: string | null;
  txId?: string | null;
  isPaid: boolean;
  /** Amount in satoshis. */
  sent: number;
  /** Fees in millisatoshis. */
  fees: number;
  invoice?: string | null;
  completedAt?: number | null;
  createdAt: number;
}

export interface LnUrlWithdrawal {
  url: string;
  /** Amounts in millisatoshis. */
  minWithdrawable: number;
  maxWithdrawable: number;
  description: string;
  k1: string;
  invoice: string;
}

export interface WebsocketPayment {
  type: "payment_received";
  amountSat: number;
  paymentHash: string;
  externalId?: string | null;
  payerNote?: string | null;
  payerKey?: string | null;
  timestamp: number;
}

export interface InvoiceFeatures {
  activated: Record<string, string>;
  unknown: number[];
}

export interface DecodedInvoice {
  chain: string;
  /** Invoice amount in millisatoshis. Omitted for amountless invoices. */
  amount?: number | null;
  paymentHash: string;
  description?: string | null;
  descriptionHash?: string | null;
  minFinalCltvExpiryDelta?: number | null;
  paymentSecret: string;
  paymentMetadata?: string | null;
  expirySeconds?: number | null;
  extraHops: JsonObject[][];
  features?: InvoiceFeatures | null;
  timestampSeconds: number;
  unknownTags?: JsonObject[] | null;
  invalidTags?: JsonObject[] | null;
}

export interface DecodedOffer {
  chain: string;
  chainHashes?: string[] | null;
  /** Amount in millisatoshis for Bitcoin offers; check currency for other offers. */
  amount?: number | null;
  currency?: string | null;
  issuer?: string | null;
  quantityMax?: number | null;
  description?: string | null;
  metadata?: string | null;
  /** Absolute offer expiry, in Unix seconds. */
  expirySeconds?: number | null;
  issuerId?: string | null;
  path?: JsonObject[] | null;
  features?: InvoiceFeatures | null;
  unknownTlvs?: JsonObject[] | null;
}

export interface PhoenixdClient {
  createInvoice(
    params: CreateInvoiceParams,
    options?: RequestOptions,
  ): Promise<CreateInvoiceResponse>;
  payInvoice(
    params: PayInvoiceParams,
    options?: RequestOptions,
  ): Promise<PaymentResult>;
  createOffer(
    params?: CreateOfferParams,
    options?: RequestOptions,
  ): Promise<string>;
  payOffer(
    params: PayOfferParams,
    options?: RequestOptions,
  ): Promise<PaymentResult>;
  payLnAddress(
    params: PayLnAddressParams,
    options?: RequestOptions,
  ): Promise<PaymentResult>;
  sendToAddress(
    params: SendToAddressParams,
    options?: RequestOptions,
  ): Promise<string>;
  bumpFee(params: BumpFeeParams, options?: RequestOptions): Promise<string>;
  closeChannel(
    params: CloseChannelParams,
    options?: RequestOptions,
  ): Promise<string>;
  listIncomingPayments(
    params?: ListIncomingPaymentsParams,
    options?: RequestOptions,
  ): Promise<IncomingPayment[]>;
  listOutgoingPayments(
    params?: ListOutgoingPaymentsParams,
    options?: RequestOptions,
  ): Promise<OutgoingPayment[]>;
  exportPayments(
    params?: ExportPaymentsParams,
    options?: RequestOptions,
  ): Promise<string>;
  getInfo(options?: RequestOptions): Promise<NodeInfo>;
  getBalance(options?: RequestOptions): Promise<Balance>;
  getLightningAddress(options?: RequestOptions): Promise<string>;
  getOffer(options?: RequestOptions): Promise<string>;
  getSwapInAddress(options?: RequestOptions): Promise<SwapInAddress>;
  listChannels(options?: RequestOptions): Promise<ListChannelsResponse>;
  decodeInvoice(
    params: DecodeInvoiceParams,
    options?: RequestOptions,
  ): Promise<DecodedInvoice>;
  decodeOffer(
    params: DecodeOfferParams,
    options?: RequestOptions,
  ): Promise<DecodedOffer>;
  estimateLiquidityFees(
    params: EstimateLiquidityFeesParams,
    options?: RequestOptions,
  ): Promise<LiquidityFeesEstimate>;
  lnUrlPay(
    params: LnUrlPayParams,
    options?: RequestOptions,
  ): Promise<PaymentResult>;
  lnUrlWithdraw(
    params: LnUrlWithdrawParams,
    options?: RequestOptions,
  ): Promise<LnUrlWithdrawal>;
  lnUrlAuth(params: LnUrlAuthParams, options?: RequestOptions): Promise<string>;
  getIncomingPayment(
    id: string,
    options?: RequestOptions,
  ): Promise<IncomingPayment | null>;
  getOutgoingPayment(
    id: string,
    options?: RequestOptions,
  ): Promise<OutgoingPayment | null>;
  getOutgoingPaymentByHash(
    id: string,
    options?: RequestOptions,
  ): Promise<OutgoingPayment | null>;
  subscribePayments(
    options: import("./subscriptions").PaymentSubscriptionOptions,
  ): import("./subscriptions").PaymentSubscription;
}
