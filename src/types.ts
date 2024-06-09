export interface LocalParams {
  nodeId: string;
  fundingKeyPath: string;
  dustLimit: number;
  maxHtlcValueInFlightMsat: number;
  htlcMinimum: number;
  toSelfDelay: number;
  maxAcceptedHtlcs: number;
  isInitiator: boolean;
}

export interface RemoteParams {
  nodeId: string;
  dustLimit: number;
  maxHtlcValueInFlightMsat: number;
  htlcMinimum: number;
}

export interface Commitments {
  params: {
    channelId: string;
    channelConfig: string[];
    channelFeatures: string[];
    localParams: LocalParams;
    remoteParams: RemoteParams;
    channelFlags: number;
  };
}

export interface ChannelUpdate {
  signature: string;
  chainHash: string;
  shortChannelId: string;
  timestampSeconds: number;
  messageFlags: number;
  channelFlags: number;
  cltvExpiryDelta: number;
  htlcMinimumMsat: number;
  feeBaseMsat: number;
  feeProportionalMillionths: number;
  htlcMaximumMsat: number;
}

export interface ChannelCompact {
  state: string;
  channelId: string;
  balanceSat: number;
  inboundLiquiditySat: number;
  capacitySat: number;
  fundingTxId: string;
}

export interface Channel {
  type: string;
  commitments: Commitments;
  shortChannelId: string;
  channelUpdate: ChannelUpdate;
}

export interface CloseChannelParams {
  /** identifier of the channel to close */
  channelId: string;
  /** bitcoin address where your balance will be sent to */
  address: string;
  /** fee rate in satoshi per vbyte */
  feerateSatByte: number;
}

export interface CreateInvoiceParams {
  /** the description of the invoice (max. 128 characters) */
  description?: string;
  /** sha256 hash of a description */
  descriptionHash?: string;
  /** the amount requested by the invoice, in satoshi. */
  amountSat?: number;
  /** the invoice expiry in seconds, by default 3600 (1 hour). */
  expirySeconds?: number;
  /** an optional custom identifier. Use that to link the invoice to an external system. */
  externalId?: string;
  /** a webhook url that will be notified when this specific payment has been received. */
  webhookUrl?: string;
}

export interface PayInvoiceParams {
  /** BOLT11 invoice */
  invoice: string;
  /**  optional amount in satoshi. If unset, will pay the amount requested in the invoice */
  amountSat?: number;
  /** optional, mutually exclusive with amountSat. Will empty the wallet if there is a single channel. */
  sendAll?: boolean;
}

export interface CreateOfferParams {
  /** the description of the offer (max. 128 characters) */
  description?: string;
  /** the amount requested by the offer, in satoshi. */
  amountSat?: number;
}

export interface PayOfferParams {
  /** BOLT12 offer */
  offer: string;
  /** optional amount in satoshi. If unset, will pay the amount requested in the invoice */
  amountSat?: number;
  /** optional, mutually exclusive with amountSat. Will empty the wallet if there is a single channel. */
  sendAll?: boolean;
  /** optional message */
  message?: string;
}

export interface PayLnAddressParams {
  /** email-like Lightning address, based on BIP-353 or LNURL */
  address: string;
  /** amount in satoshi. If unset, will pay the amount requested in the invoice */
  amountSat?: number;
  /** optional, mutually exclusive with amountSat. Will empty the wallet if there is a single channel. */
  sendAll?: boolean;
  /** optional message for the recipient */
  message?: string;
}

export interface SendToAddressParams {
  /** amount in satoshi */
  amountSat: number;
  /** Bitcoin address where funds will be sent */
  address: string;
  /** feerate in satoshi per vbyte */
  feerateSatByte: number;
}

export interface BumpFeeParams {
  /** fee rate in satoshi per vbyte */
  feerateSatByte: number;
}

export interface ListIncomingPaymentsParams {
  /** start timestamp in millis from epoch, default 0 */
  from?: Date;
  /** end timestamp in millis from epoch, default now */
  to?: Date;
  /** number of payments in the page, default 20 */
  limit?: number;
  /** page offset, default 0 */
  offset?: number;
  /** also return unpaid invoices */
  all?: boolean;
  /** only include payments that use this external id */
  externalId?: string;
}

export interface ListOutgoingPaymentsParams {
  /** start timestamp in millis from epoch, default 0 */
  from?: Date;
  /** end timestamp in millis from epoch, default now */
  to?: Date;
  /** number of payments in the page, default 20 */
  limit?: number;
  /** page offset, default 0 */
  offset?: number;
  /** also return unpaid invoices */
  all?: boolean;
}

export interface ExportPaymentsParams {
  /** start timestamp in millis from epoch, default 0 */
  from?: Date | number;
  /** end timestamp in millis from epoch, default now */
  to?: Date | number;
}

export interface DecodeInvoiceParams {
  /** BOLT11 invoice */
  invoice: string;
}

export interface DecodeOfferParams {
  /** BOLT12 offer */
  offer: string;
}

export interface EstimateLiquidityFeesParams {
  /** the liquidity amount, in satoshi */
  amountSat: number;
}

export interface lnUrlPayParams {
  /** amount in satoshi */
  amountSat?: number;
  /** optional, mutually exclusive with amountSat. Will empty the wallet if there is a single channel. */
  sendAll?: boolean;
  /** the lnurl-pay resource */
  lnurl: string;
  /** (optional) a comment for the recipient */
  message?: string;
}

export interface lnUrlWithdrawParams {
  /** the lnurl-withdraw resource */
  lnurl: string;
}

export interface lnUrlAuthParams {
  /** the lnurl-auth resource */
  lnurl: string;
}

export interface CreateInvoiceResponse {
  amountSat: number;
  paymentHash: string;
  serialized: string;
}

export interface Payment {
  recipientAmountSat: number;
  routingFeeSat: number;
  paymentId: string;
  paymentHash: string;
  paymentPreimage: string;
}

export interface NodeInfo {
  nodeId: string;
  channels: ChannelCompact[];
}

export interface Balance {
  balanceSat: number;
  feeCreditSat: number;
}

export interface LiquidityFeesEstimate {
  miningFeeSat: number;
  serviceFeeSat: number;
}

export type ListChannelsResponse = Channel[];

export type IncomingPaymentType = "incoming_payment";
export type IncomingPaymentSubType = "lightning";

export interface IncomingPayment {
  type: IncomingPaymentType;
  subType: IncomingPaymentSubType;
  paymentHash: string;
  preimage: string;
  externalId?: string | null;
  description?: string;
  invoice?: string;
  isPaid: boolean;
  isExpired?: boolean;
  requestedSat?: number;
  receivedSat: number;
  fees: number;
  payerKey?: string;
  expiresAt?: number;
  completedAt?: number;
  createdAt: number;
}

export type OutgoingPaymentType = "outgoing_payment";
export type OutgoingPaymentSubType = "lightning" | "auto_liquidity";

export interface OutgoingPayment {
  type: OutgoingPaymentType;
  subType: OutgoingPaymentSubType;
  paymentId: string;
  paymentHash?: string;
  preimage?: string;
  txId?: string;
  isPaid: boolean;
  sent: number;
  fees: number;
  invoice?: string;
  completedAt?: number;
  createdAt: number;
}

export interface LnUrlWithdrawal {
  url: string;
  minWithdrawable: number;
  maxWithdrawable: number;
  description: string;
  k1: string;
  invoice: string;
}

/* Websocket payload for payment notifications */
export interface WebsocketPayment {
  type: "payment_received";
  amountSat: number;
  paymentHash: string;
  externalId?: string | null;
  payerNote?: string | null;
  payerKey?: string | null;
  timestamp?: number;
}

export interface PhoenixdClient {
  createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse>;
  payInvoice(params: PayInvoiceParams): Promise<Payment>;
  createOffer(params?: CreateOfferParams): Promise<string>;
  payOffer(params: PayOfferParams): Promise<Payment>;
  payLnAddress(params: PayLnAddressParams): Promise<Payment>;
  sendToAddress(params: SendToAddressParams): Promise<string>;
  bumpFee(params: BumpFeeParams): Promise<string>;
  listIncomingPayments(
    params?: ListIncomingPaymentsParams
  ): Promise<IncomingPayment[]>;
  getIncomingPayment(paymentHash: string): Promise<IncomingPayment>;
  listOutgoingPayments(
    params?: ListOutgoingPaymentsParams
  ): Promise<OutgoingPayment[]>;
  getOutgoingPayment(paymentId: string): Promise<OutgoingPayment>;
  getOutgoingPaymentByHash(paymentHash: string): Promise<OutgoingPayment>;
  exportPayments(params?: ExportPaymentsParams): Promise<string>;
  getInfo(): Promise<NodeInfo>;
  getBalance(): Promise<Balance>;
  getLightningAddress(): Promise<string>;
  listChannels(): Promise<ListChannelsResponse>;
  closeChannel(params: CloseChannelParams): Promise<string>;
  decodeInvoice(params: DecodeInvoiceParams): Promise<any>;
  decodeOffer(params: DecodeOfferParams): Promise<any>;
  estimateLiquidityFees(
    params: EstimateLiquidityFeesParams
  ): Promise<LiquidityFeesEstimate>;
  lnUrlPay(params: lnUrlPayParams): Promise<Payment>;
  lnUrlWithdraw(params: lnUrlWithdrawParams): Promise<LnUrlWithdrawal>;
  lnUrlAuth(params: lnUrlAuthParams): Promise<string>;
}
