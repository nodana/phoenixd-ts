import { base64Encode } from "./utils";
import type { PhoenixdOptions, RequestOptions } from "./types";

type Params = object;

interface ResponseOptions {
  query?: boolean;
  missing?: boolean;
  text?: boolean;
}

export class HttpClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string,
  ) {
    super(`Phoenixd request failed: HTTP ${status} ${statusText}`);
    this.name = "HttpClientError";
  }
}

export class PhoenixdResponseError extends Error {
  constructor(
    public readonly body: string,
    options?: ErrorOptions,
  ) {
    super("Phoenixd returned an invalid JSON response", options);
    this.name = "PhoenixdResponseError";
  }
}

export function endpoint(base: string, path: string): URL {
  const url = new URL(base);

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(
      "Phoenixd URL must use HTTP(S), without credentials, query or fragment",
    );
  }

  url.pathname = `${url.pathname.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  return url;
}

export function encodeParams(params: Params): URLSearchParams {
  const result = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    const encoded = value instanceof Date ? value.getTime() : value;

    if (typeof encoded === "number" && !Number.isFinite(encoded))
      throw new TypeError(`${key} must be finite`);

    result.set(key, String(encoded));
  }

  return result;
}

export function validateTimeout(timeoutMs: number | undefined): void {
  if (
    timeoutMs !== undefined &&
    (!Number.isSafeInteger(timeoutMs) ||
      timeoutMs < 0 ||
      timeoutMs > 2_147_483_647)
  ) {
    throw new TypeError(
      "timeoutMs must be an integer between 0 and 2147483647",
    );
  }
}

export class HttpClient {
  readonly #authorization: string;
  private readonly fetcher: typeof globalThis.fetch;

  constructor(
    private readonly url: string,
    password: string,
    private readonly options: PhoenixdOptions = {},
  ) {
    endpoint(url, "");
    validateTimeout(options.timeoutMs);
    this.#authorization = `Basic ${base64Encode(`:${password}`)}`;
    this.fetcher = options.fetch ?? globalThis.fetch;

    if (!this.fetcher)
      throw new TypeError("This runtime requires a fetch implementation");
  }

  async request<T>(
    method: "GET" | "POST",
    path: string,
    params: Params = {},
    options: RequestOptions = {},
    responseOptions: ResponseOptions = {},
  ): Promise<T> {
    const { query, missing, text } = responseOptions;
    const url = endpoint(this.url, path);
    const encoded = encodeParams(params);

    if (method === "GET" || query) url.search = encoded.toString();

    const timeoutMs = options.timeoutMs ?? this.options.timeoutMs;

    validateTimeout(timeoutMs);

    const controller = new AbortController();
    const signals = [this.options.signal, options.signal].filter(
      (s): s is AbortSignal => s !== undefined,
    );
    const listeners = signals.map((signal) => {
      const abort = () => controller.abort(signal.reason);

      if (signal.aborted) controller.abort(signal.reason);
      else signal.addEventListener("abort", abort, { once: true });

      return { signal, abort };
    });
    const timer = timeoutMs
      ? setTimeout(() => {
          const error = new Error("Phoenixd request timed out");

          error.name = "TimeoutError";
          controller.abort(error);
        }, timeoutMs)
      : undefined;

    try {
      const response = await this.fetcher(url.toString(), {
        method,
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: this.#authorization,
          ...(method === "POST" && !query
            ? { "Content-Type": "application/x-www-form-urlencoded" }
            : {}),
        },
        ...(method === "POST" && !query ? { body: encoded.toString() } : {}),
      });
      const body = await response.text();

      if (missing && (response.status === 204 || response.status === 404))
        return null as T;

      if (!response.ok)
        throw new HttpClientError(response.status, response.statusText, body);

      if (text) {
        // Phoenixd returns both JSON strings and text/plain strings.
        if (
          response.headers.get("content-type")?.includes("application/json")
        ) {
          try {
            const value: unknown = JSON.parse(body);

            if (typeof value === "string") return value as T;
          } catch (cause) {
            throw new PhoenixdResponseError(body, { cause });
          }

          throw new PhoenixdResponseError(body);
        }

        return body as T;
      }

      try {
        return JSON.parse(body) as T;
      } catch (cause) {
        throw new PhoenixdResponseError(body, { cause });
      }
    } finally {
      if (timer !== undefined) clearTimeout(timer);

      for (const { signal, abort } of listeners)
        signal.removeEventListener("abort", abort);
    }
  }
}
