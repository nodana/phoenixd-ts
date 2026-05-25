import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HttpClient, HttpClientError } from "../src/HttpClient";

const NODE_URL = "https://nodeurl.com";

describe("HttpClient", () => {
  let http: HttpClient;
  let fetchStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    http = new HttpClient(NODE_URL, "password");
    fetchStub = vi.fn();
    fetchStub.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(JSON.stringify({ foo: "bar" })),
    });
    vi.stubGlobal("fetch", fetchStub);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should make GET request", async () => {
    const response = await http.get("/path");

    expect(fetchStub).toHaveBeenCalledWith(`${NODE_URL}/path`, {
      method: "GET",
      headers: {
        Authorization: "Basic OnBhc3N3b3Jk",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    expect(response).toEqual({ foo: "bar" });
  });

  it("should encode non-ascii passwords in the auth header", async () => {
    http = new HttpClient(NODE_URL, "pässword");
    vi.stubGlobal("fetch", fetchStub);

    await http.get("/path");

    expect(fetchStub).toHaveBeenCalledWith(`${NODE_URL}/path`, {
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

    expect(fetchStub).toHaveBeenCalledWith(`${NODE_URL}/path`, {
      method: "POST",
      headers: {
        Authorization: "Basic OnBhc3N3b3Jk",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "payload=test-payload&at=1000",
    });
  });

  it("should parse plain text responses", async () => {
    fetchStub.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("plain response"),
    });

    const response = await http.get("/path");

    expect(response).toBe("plain response");
  });

  it("should include response details in failed requests", async () => {
    fetchStub.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      text: vi.fn().mockResolvedValue("invalid invoice"),
    });

    try {
      await http.get("/path");
      throw new Error("Expected request to fail");
    } catch (error: any) {
      expect(error).toBeInstanceOf(HttpClientError);
      expect(error.message).toBe(
        "Request failed with status 400: invalid invoice"
      );
      expect(error.status).toBe(400);
      expect(error.statusText).toBe("Bad Request");
      expect(error.body).toBe("invalid invoice");
    }
  });

  it("should fall back to status text for failed requests without a body", async () => {
    fetchStub.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: vi.fn().mockResolvedValue(""),
    });

    try {
      await http.get("/path");
      throw new Error("Expected request to fail");
    } catch (error: any) {
      expect(error).toBeInstanceOf(HttpClientError);
      expect(error.message).toBe(
        "Request failed with status 500: Internal Server Error"
      );
      expect(error.body).toBe("");
    }
  });
});
