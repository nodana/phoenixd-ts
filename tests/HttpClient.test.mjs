import chai from "chai";
import sinonChai from "sinon-chai";
import sinon from "sinon";

const expect = chai.expect;
chai.use(sinonChai);

import { HttpClient, HttpClientError } from "../dist/HttpClient.js";

const NODE_URL = "https://nodeurl.com";

describe("HttpClient", () => {
  let http;
  let fetchStub;

  beforeEach(() => {
    http = new HttpClient(NODE_URL, "password");
    fetchStub = sinon.stub();
    fetchStub.resolves({
      ok: true,
      status: 200,
      text: sinon.fake.resolves(JSON.stringify({ foo: "bar" })),
    });
    global.fetch = fetchStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should make GET request", async () => {
    const response = await http.get("/path");

    expect(fetchStub).to.have.been.calledWith(`${NODE_URL}/path`, {
      method: "GET",
      headers: {
        Authorization: "Basic OnBhc3N3b3Jk",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    expect(response).to.deep.equal({ foo: "bar" });
  });

  it("should encode non-ascii passwords in the auth header", async () => {
    http = new HttpClient(NODE_URL, "pässword");
    global.fetch = fetchStub;

    await http.get("/path");

    expect(fetchStub).to.have.been.calledWith(`${NODE_URL}/path`, {
      method: "GET",
      headers: {
        Authorization: "Basic OnDDpHNzd29yZA==",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  });

  it("should make POST request", async () => {
    const body = {
      payload: "test-payload",
      at: new Date(1000),
      unset: undefined,
      empty: null,
    };

    await http.post("/path", body);

    expect(fetchStub).to.have.been.calledWith(`${NODE_URL}/path`, {
      method: "POST",
      headers: {
        Authorization: "Basic OnBhc3N3b3Jk",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "payload=test-payload&at=1000",
    });
  });

  it("should parse plain text responses", async () => {
    fetchStub.resolves({
      ok: true,
      status: 200,
      text: sinon.fake.resolves("plain response"),
    });

    const response = await http.get("/path");

    expect(response).to.equal("plain response");
  });

  it("should include response details in failed requests", async () => {
    fetchStub.resolves({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: sinon.fake.resolves("invalid invoice"),
    });

    try {
      await http.get("/path");
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(error).to.be.instanceOf(HttpClientError);
      expect(error.message).to.equal(
        "Request failed with status 400: invalid invoice"
      );
      expect(error.status).to.equal(400);
      expect(error.statusText).to.equal("Bad Request");
      expect(error.body).to.equal("invalid invoice");
    }
  });

  it("should fall back to status text for failed requests without a body", async () => {
    fetchStub.resolves({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: sinon.fake.resolves(""),
    });

    try {
      await http.get("/path");
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(error).to.be.instanceOf(HttpClientError);
      expect(error.message).to.equal(
        "Request failed with status 500: Internal Server Error"
      );
      expect(error.body).to.equal("");
    }
  });
});
