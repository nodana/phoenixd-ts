import { describe, it, expect, vi } from "vitest";
import { Phoenixd, HttpClientError, PhoenixdResponseError } from "../src";

function client(response: Response, options = {}) {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response);

  return {
    node: new Phoenixd("https://node.example/api/", "pässword", {
      fetch,
      ...options,
    }),
    fetch,
  };
}

describe("HTTP transport", () => {
  it("authenticates and form-encodes Unicode without losing empty descriptions or zero values", async () => {
    const { node, fetch } = client(
      Response.json({ paymentHash: "hash", serialized: "invoice" }),
    );

    await node.createInvoice({
      description: "",
      amountSat: 0,
      externalId: "order + café",
      expirySeconds: 1,
    });

    const [url, init] = fetch.mock.calls[0]!;

    expect(url).toBe("https://node.example/api/createinvoice");
    expect(init?.headers).toMatchObject({
      Authorization: "Basic OnDDpHNzd29yZA==",
      "Content-Type": "application/x-www-form-urlencoded",
    });
    expect(new URLSearchParams(String(init?.body)).get("description")).toBe("");
    expect(new URLSearchParams(String(init?.body)).get("externalId")).toBe(
      "order + café",
    );
    expect(new URLSearchParams(String(init?.body)).get("amountSat")).toBe("0");
    expect(init?.redirect).toBe("error");
  });

  it("sends export date filters as query parameters with no form body", async () => {
    const { node, fetch } = client(Response.json("exported"));

    expect(await node.exportPayments({ from: new Date(1000), to: 2000 })).toBe(
      "exported",
    );
    expect(fetch.mock.calls[0]![0]).toBe(
      "https://node.example/api/export?from=1000&to=2000",
    );
    expect(fetch.mock.calls[0]![1]?.body).toBeUndefined();
  });

  it.each([204, 404])(
    "returns null for missing payment lookup (%i)",
    async (status) => {
      const { node } = client(new Response(null, { status }));

      expect(await node.getIncomingPayment("a".repeat(64))).toBeNull();
    },
  );

  it("keeps non-lookup 404 errors actionable", async () => {
    const { node } = client(
      new Response("Unknown endpoint", {
        status: 404,
        statusText: "Not Found",
      }),
    );

    await expect(node.getOffer()).rejects.toMatchObject({
      name: "HttpClientError",
      status: 404,
      body: "Unknown endpoint",
    });
  });

  it("exports HTTP errors without including a response body in the message", async () => {
    const { node } = client(
      new Response("sensitive detail", {
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    try {
      await node.getInfo();

      throw new Error("Expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpClientError);
      expect((error as HttpClientError).body).toBe("sensitive detail");
      expect((error as Error).message).not.toContain("sensitive detail");
    }
  });

  it("rejects malformed JSON instead of silently returning text", async () => {
    const { node } = client(new Response("<html>proxy error</html>"));

    await expect(node.getBalance()).rejects.toBeInstanceOf(
      PhoenixdResponseError,
    );
  });

  it.each([
    new Response("transaction not confirmed"),
    Response.json("transaction not confirmed"),
  ])("preserves textual business results", async (response) => {
    const { node } = client(response);

    expect(await node.bumpFee({ feerateSatByte: 5 })).toBe(
      "transaction not confirmed",
    );
  });

  it("returns the HTTP 200 payment failure as a discriminated result", async () => {
    const result = { type: "payment_failed", reason: "Insufficient balance" };
    const { node, fetch } = client(Response.json(result));

    expect(await node.payInvoice({ invoice: "lnbc..." })).toEqual(result);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failed payment request", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockRejectedValue(new TypeError("Network failure"));
    const node = new Phoenixd("http://localhost:9740", "password", { fetch });

    await expect(node.payInvoice({ invoice: "lnbc..." })).rejects.toThrow(
      "Network failure",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("honours both default and per-request abort signals", async () => {
    const defaults = new AbortController();
    const request = new AbortController();

    const fetch: typeof globalThis.fetch = async (_url, init) => {
      const signal = init!.signal!;

      return new Promise((_resolve, reject) => {
        if (signal.aborted) reject(signal.reason);
        else
          signal.addEventListener("abort", () => reject(signal.reason), {
            once: true,
          });
      });
    };

    const node = new Phoenixd("http://localhost:9740", "password", {
      fetch,
      signal: defaults.signal,
    });
    const pending = node.getInfo({ signal: request.signal });

    request.abort(new Error("Cancelled request"));
    await expect(pending).rejects.toThrow("Cancelled request");
    defaults.abort(new Error("Closed client"));
    await expect(node.getInfo()).rejects.toThrow("Closed client");
  });

  it("applies deadlines until the response body is read and allows disabling them per request", async () => {
    vi.useFakeTimers();

    try {
      const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(
        async (_url, init) =>
          ({
            ok: true,
            status: 200,
            text: () =>
              new Promise((_resolve, reject) =>
                init!.signal!.addEventListener("abort", () =>
                  reject(init!.signal!.reason),
                ),
              ),
          }) as Response,
      );
      const node = new Phoenixd("http://localhost:9740", "password", {
        fetch,
        timeoutMs: 100,
      });
      const pending = expect(node.getBalance()).rejects.toMatchObject({
        name: "TimeoutError",
      });

      await vi.advanceTimersByTimeAsync(100);
      await pending;
      fetch.mockResolvedValueOnce(
        Response.json({ balanceSat: 0, feeCreditSat: 0 }),
      );
      await node.getBalance({ timeoutMs: 0 });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    "ftp://example.com",
    "https://user:secret@example.com",
    "https://example.com?x=1",
    "https://example.com/#fragment",
  ])("rejects unsafe base URL %s", (url) => {
    expect(() => new Phoenixd(url, "password")).toThrow(TypeError);
  });

  it("rejects invalid deadlines and dates", async () => {
    expect(
      () => new Phoenixd("http://localhost", "password", { timeoutMs: -1 }),
    ).toThrow(TypeError);

    const { node, fetch } = client(Response.json([]));

    await expect(
      node.listIncomingPayments({ from: new Date("invalid") }),
    ).rejects.toThrow("from must be finite");
    expect(fetch).not.toHaveBeenCalled();
  });
});
