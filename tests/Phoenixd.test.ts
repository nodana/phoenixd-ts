import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Phoenixd } from "../src/Phoenixd";
import { HttpClient } from "../src/HttpClient";

const NODE_URL = "https://nodeurl.com";

describe("Phoenixd", () => {
  let pxd;
  let getStub: ReturnType<typeof vi.spyOn>;
  let postStub: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getStub = vi.spyOn(HttpClient.prototype, "get").mockResolvedValue({ test: "12345" });
    postStub = vi.spyOn(HttpClient.prototype, "post").mockResolvedValue({ test: "abcde" });

    pxd = new Phoenixd(NODE_URL, "password");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createInvoice", () => {
    describe("When called with a description", () => {
      it("should make correct request", async () => {
        const data = {
          description: "Invoice Description",
          amountSat: 1000,
          expirySeconds: 600,
          webhookUrl: "https://webhook.example",
        };
        await pxd.createInvoice(data);

        expect(postStub).toHaveBeenCalledWith("/createinvoice", data);
      });
    });

    describe("When called with a description hash", () => {
      it("should make correct request", async () => {
        const data = {
          descriptionHash: "12345",
        };
        await pxd.createInvoice(data);

        expect(postStub).toHaveBeenCalledWith("/createinvoice", data);
      });
    });

    describe("When called without a description or descriptionHash", () => {
      it("should not make request", async () => {
        const data = {
          amountSat: 1000,
        };
        await pxd.createInvoice(data);

        expect(postStub).not.toHaveBeenCalled();
      });
    });
  });

  describe("When payInvoice method is called", () => {
    it("should make correct request", async () => {
      const data = {
        invoice: "12345",
        sendAll: true,
      };
      await pxd.payInvoice(data);

      expect(postStub).toHaveBeenCalledWith("/payinvoice", data);
    });
  });

  describe("When createOffer method is called", () => {
    it("should make correct request", async () => {
      const data = {
        description: "Offer Description",
        amountSat: 1000,
      };
      await pxd.createOffer(data);

      expect(postStub).toHaveBeenCalledWith("/createoffer", data);
    });

    it("should make correct request without params", async () => {
      await pxd.createOffer();

      expect(postStub).toHaveBeenCalledWith("/createoffer", {});
    });
  });

  describe("When payOffer method is called", () => {
    it("should make correct request", async () => {
      const data = {
        offer: "12345",
        sendAll: true,
      };
      await pxd.payOffer(data);

      expect(postStub).toHaveBeenCalledWith("/payoffer", data);
    });
  });

  describe("When payLnAddress method is called", () => {
    it("should make correct request", async () => {
      const data = {
        amountSat: 1000,
        address: "test@address.com",
        message: "test message",
        sendAll: false,
      };
      await pxd.payLnAddress(data);

      expect(postStub).toHaveBeenCalledWith("/paylnaddress", data);
    });
  });

  describe("When sendToAddress method is called", () => {
    it("should make correct request", async () => {
      const data = {
        amountSat: 1000,
        address: "12345",
        feerateSatByte: 5,
      };
      await pxd.sendToAddress(data);

      expect(postStub).toHaveBeenCalledWith("/sendtoaddress", data);
    });
  });

  describe("When bumpFee method is called", () => {
    it("should make correct request", async () => {
      const data = {
        feerateSatByte: 5,
      };
      await pxd.bumpFee(data);

      expect(postStub).toHaveBeenCalledWith("/bumpfee", data);
    });
  });

  describe("listIncomingPayments", () => {
    describe("When method is called without params", () => {
      it("should make correct request", async () => {
        await pxd.listIncomingPayments();

        expect(getStub).toHaveBeenCalledWith("/payments/incoming");
      });
    });

    describe("When method is called with params", () => {
      it("should make correct request", async () => {
        await pxd.listIncomingPayments({
          from: new Date(1000),
          limit: 3,
          offset: 1,
          all: true,
        });

        expect(getStub).toHaveBeenCalledWith(
          "/payments/incoming?from=1000&limit=3&offset=1&all=true"
        );
      });
    });
  });

  describe("When getIncomingPayment method is called", () => {
    it("should make correct request", async () => {
      const paymentHash = "12345";
      await pxd.getIncomingPayment(paymentHash);

      expect(getStub).toHaveBeenCalledWith(
        `/payments/incoming/${paymentHash}`
      );
    });
  });

  describe("listOutgoingPayments", () => {
    describe("When method is called without params", () => {
      it("should make correct request", async () => {
        await pxd.listOutgoingPayments();

        expect(getStub).toHaveBeenCalledWith("/payments/outgoing");
      });
    });

    describe("When listOutgoingPayments method is called with params", () => {
      it("should make correct request", async () => {
        await pxd.listOutgoingPayments({
          to: new Date(2000),
          limit: 3,
          offset: 1,
          all: true,
        });

        expect(getStub).toHaveBeenCalledWith(
          "/payments/outgoing?to=2000&limit=3&offset=1&all=true"
        );
      });
    });
  });

  describe("When getOutgoingPayment method is called", () => {
    it("should make correct request", async () => {
      const paymentHash = "12345";
      await pxd.getOutgoingPayment(paymentHash);

      expect(getStub).toHaveBeenCalledWith(
        `/payments/outgoing/${paymentHash}`
      );
    });
  });

  describe("When getOutgoingPaymentByHash method is called", () => {
    it("should make correct request", async () => {
      const paymentHash = "12345";
      await pxd.getOutgoingPaymentByHash(paymentHash);

      expect(getStub).toHaveBeenCalledWith(
        `/payments/outgoingbyhash/${paymentHash}`
      );
    });
  });

  describe("exportPayments", () => {
    describe("When method is called without params", () => {
      it("should make correct request", async () => {
        await pxd.exportPayments();

        expect(postStub).toHaveBeenCalledWith("/export", {});
      });
    });

    describe("When method is called with params", () => {
      it("should make correct request", async () => {
        const data = {
          from: new Date(1000),
          to: 2000,
        };
        await pxd.exportPayments(data);

        expect(postStub).toHaveBeenCalledWith("/export", data);
      });
    });
  });

  describe("When getInfo method is called", () => {
    it("should make correct request", async () => {
      await pxd.getInfo();

      expect(getStub).toHaveBeenCalledWith("/getinfo");
    });
  });

  describe("When getBalance method is called", () => {
    it("should make correct request", async () => {
      await pxd.getBalance();

      expect(getStub).toHaveBeenCalledWith("/getbalance");
    });
  });

  describe("When getLightningAddress method is called", () => {
    it("should make correct request", async () => {
      await pxd.getLightningAddress();

      expect(getStub).toHaveBeenCalledWith("/getlnaddress");
    });
  });

  describe("When listChannels method is called", () => {
    it("should make correct request", async () => {
      await pxd.listChannels();

      expect(getStub).toHaveBeenCalledWith("/listchannels");
    });
  });

  describe("When closeChannel method is called", () => {
    it("should make correct request", async () => {
      const data = {
        channelId: "12345",
        address: "12345",
        feerateSatByte: 5,
      };
      await pxd.closeChannel(data);

      expect(postStub).toHaveBeenCalledWith("/closechannel", data);
    });
  });

  describe("When decodeInvoice method is called", () => {
    it("should make correct request", async () => {
      const data = {
        invoice: "12345",
      };
      await pxd.decodeInvoice(data);

      expect(postStub).toHaveBeenCalledWith("/decodeinvoice", data);
    });
  });

  describe("When decodeOffer method is called", () => {
    it("should make correct request", async () => {
      const data = {
        offer: "12345",
      };
      await pxd.decodeOffer(data);

      expect(postStub).toHaveBeenCalledWith("/decodeoffer", data);
    });
  });

  describe("When estimateLiquidityFees method is called", () => {
    it("should make correct request", async () => {
      await pxd.estimateLiquidityFees({ amountSat: 2000000 });

      expect(getStub).toHaveBeenCalledWith(
        "/estimateliquidityfees?amountSat=2000000"
      );
    });
  });

  describe("When lnUrlPay method is called", () => {
    it("should make correct request", async () => {
      const data = {
        amountSat: 1000,
        lnurl: "LNURL12345",
        message: "Test message",
        sendAll: false,
      };
      await pxd.lnUrlPay(data);

      expect(postStub).toHaveBeenCalledWith("/lnurlpay", data);
    });
  });

  describe("When lnUrlWithdraw method is called", () => {
    it("should make correct request", async () => {
      const data = {
        lnurl: "LNURL12345",
      };
      await pxd.lnUrlWithdraw(data);

      expect(postStub).toHaveBeenCalledWith("/lnurlwithdraw", data);
    });
  });

  describe("When lnUrlAuth method is called", () => {
    it("should make correct request", async () => {
      const data = {
        lnurl: "LNURL12345",
      };
      await pxd.lnUrlAuth(data);

      expect(postStub).toHaveBeenCalledWith("/lnurlauth", data);
    });
  });
});
