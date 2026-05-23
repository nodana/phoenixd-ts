import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
const expect = chai.expect;
chai.use(sinonChai);

import { Phoenixd } from "../dist/Phoenixd.js";
import { HttpClient } from "../dist/HttpClient.js";

const NODE_URL = "https://nodeurl.com";

describe("Phoenixd", () => {
  let pxd;
  let getStub;
  let postStub;

  beforeEach(() => {
    getStub = sinon
      .stub(HttpClient.prototype, "get")
      .resolves({ test: "12345" });
    postStub = sinon
      .stub(HttpClient.prototype, "post")
      .resolves({ test: "abcde" });

    pxd = new Phoenixd(NODE_URL, "password");
  });

  afterEach(() => {
    sinon.restore();
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

        expect(postStub).to.have.been.calledWith("/createinvoice", data);
      });
    });

    describe("When called with a description hash", () => {
      it("should make correct request", async () => {
        const data = {
          descriptionHash: "12345",
        };
        await pxd.createInvoice(data);

        expect(postStub).to.have.been.calledWith("/createinvoice", data);
      });
    });

    describe("When called without a description or descriptionHash", () => {
      it("should not make request", async () => {
        const data = {
          amountSat: 1000,
        };
        await pxd.createInvoice(data);

        expect(postStub).to.have.not.been.called;
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

      expect(postStub).to.have.been.calledWith("/payinvoice", data);
    });
  });

  describe("When createOffer method is called", () => {
    it("should make correct request", async () => {
      const data = {
        description: "Offer Description",
        amountSat: 1000,
      };
      await pxd.createOffer(data);

      expect(postStub).to.have.been.calledWith("/createoffer", data);
    });

    it("should make correct request without params", async () => {
      await pxd.createOffer();

      expect(postStub).to.have.been.calledWith("/createoffer", {});
    });
  });

  describe("When payOffer method is called", () => {
    it("should make correct request", async () => {
      const data = {
        offer: "12345",
        sendAll: true,
      };
      await pxd.payOffer(data);

      expect(postStub).to.have.been.calledWith("/payoffer", data);
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

      expect(postStub).to.have.been.calledWith("/paylnaddress", data);
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

      expect(postStub).to.have.been.calledWith("/sendtoaddress", data);
    });
  });

  describe("When bumpFee method is called", () => {
    it("should make correct request", async () => {
      const data = {
        feerateSatByte: 5,
      };
      await pxd.bumpFee(data);

      expect(postStub).to.have.been.calledWith("/bumpfee", data);
    });
  });

  describe("listIncomingPayments", () => {
    describe("When method is called without params", () => {
      it("should make correct request", async () => {
        await pxd.listIncomingPayments();

        expect(getStub).to.have.been.calledWith("/payments/incoming");
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

        expect(getStub).to.have.been.calledWith(
          "/payments/incoming?from=1000&limit=3&offset=1&all=true"
        );
      });
    });
  });

  describe("When getIncomingPayment method is called", () => {
    it("should make correct request", async () => {
      const paymentHash = "12345";
      await pxd.getIncomingPayment(paymentHash);

      expect(getStub).to.have.been.calledWith(
        `/payments/incoming/${paymentHash}`
      );
    });
  });

  describe("listOutgoingPayments", () => {
    describe("When method is called without params", () => {
      it("should make correct request", async () => {
        await pxd.listOutgoingPayments();

        expect(getStub).to.have.been.calledWith("/payments/outgoing");
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

        expect(getStub).to.have.been.calledWith(
          "/payments/outgoing?to=2000&limit=3&offset=1&all=true"
        );
      });
    });
  });

  describe("When getOutgoingPayment method is called", () => {
    it("should make correct request", async () => {
      const paymentHash = "12345";
      await pxd.getOutgoingPayment(paymentHash);

      expect(getStub).to.have.been.calledWith(
        `/payments/outgoing/${paymentHash}`
      );
    });
  });

  describe("When getOutgoingPaymentByHash method is called", () => {
    it("should make correct request", async () => {
      const paymentHash = "12345";
      await pxd.getOutgoingPaymentByHash(paymentHash);

      expect(getStub).to.have.been.calledWith(
        `/payments/outgoingbyhash/${paymentHash}`
      );
    });
  });

  describe("exportPayments", () => {
    describe("When method is called without params", () => {
      it("should make correct request", async () => {
        await pxd.exportPayments();

        expect(postStub).to.have.been.calledWith("/export", {});
      });
    });

    describe("When method is called with params", () => {
      it("should make correct request", async () => {
        const data = {
          from: new Date(1000),
          to: 2000,
        };
        await pxd.exportPayments(data);

        expect(postStub).to.have.been.calledWith("/export", data);
      });
    });
  });

  describe("When getInfo method is called", () => {
    it("should make correct request", async () => {
      await pxd.getInfo();

      expect(getStub).to.have.been.calledWith("/getinfo");
    });
  });

  describe("When getBalance method is called", () => {
    it("should make correct request", async () => {
      await pxd.getBalance();

      expect(getStub).to.have.been.calledWith("/getbalance");
    });
  });

  describe("When getLightningAddress method is called", () => {
    it("should make correct request", async () => {
      await pxd.getLightningAddress();

      expect(getStub).to.have.been.calledWith("/getlnaddress");
    });
  });

  describe("When listChannels method is called", () => {
    it("should make correct request", async () => {
      await pxd.listChannels();

      expect(getStub).to.have.been.calledWith("/listchannels");
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

      expect(postStub).to.have.been.calledWith("/closechannel", data);
    });
  });

  describe("When decodeInvoice method is called", () => {
    it("should make correct request", async () => {
      const data = {
        invoice: "12345",
      };
      await pxd.decodeInvoice(data);

      expect(postStub).to.have.been.calledWith("/decodeinvoice", data);
    });
  });

  describe("When decodeOffer method is called", () => {
    it("should make correct request", async () => {
      const data = {
        offer: "12345",
      };
      await pxd.decodeOffer(data);

      expect(postStub).to.have.been.calledWith("/decodeoffer", data);
    });
  });

  describe("When estimateLiquidityFees method is called", () => {
    it("should make correct request", async () => {
      await pxd.estimateLiquidityFees({ amountSat: 2000000 });

      expect(getStub).to.have.been.calledWith(
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

      expect(postStub).to.have.been.calledWith("/lnurlpay", data);
    });
  });

  describe("When lnUrlWithdraw method is called", () => {
    it("should make correct request", async () => {
      const data = {
        lnurl: "LNURL12345",
      };
      await pxd.lnUrlWithdraw(data);

      expect(postStub).to.have.been.calledWith("/lnurlwithdraw", data);
    });
  });

  describe("When lnUrlAuth method is called", () => {
    it("should make correct request", async () => {
      const data = {
        lnurl: "LNURL12345",
      };
      await pxd.lnUrlAuth(data);

      expect(postStub).to.have.been.calledWith("/lnurlauth", data);
    });
  });
});
