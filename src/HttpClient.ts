import { base64Encode } from "./utils";

export class HttpClientError extends Error {
  status: number;
  statusText: string;
  body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`Request failed with status ${status}: ${body || statusText}`);
    this.name = "HttpClientError";
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

export interface IHttpClient {
  get(path: string): Promise<any>;
  post(path: string, data: any): Promise<any>;
}

export class HttpClient implements IHttpClient {
  private url: string;
  private password: string;
  private headers: {
    [key: string]: string;
  };

  constructor(url: string, password: string) {
    this.url = url;
    this.password = password;
    this.headers = {};

    this._setHeaders();
  }

  private _setHeaders() {
    this.headers = {
      Authorization: "Basic " + base64Encode(":" + this.password),
      "Content-Type": "application/x-www-form-urlencoded",
    };
  }

  private async _call(path: string, method: string, data?: any) {
    try {
      const options: any = {
        method,
        headers: this.headers,
      };

      if (data) {
        options.body = Object.keys(data)
          .filter((key) => data[key] !== undefined && data[key] !== null)
          .map((key) => {
            const value =
              data[key] instanceof Date ? data[key].getTime() : data[key];
            return (
              encodeURIComponent(key) + "=" + encodeURIComponent(value)
            );
          })
          .join("&");
      }

      const response = await fetch(`${this.url}${path}`, options);
      const responseText = await response.text();

      if (!response.ok) {
        throw new HttpClientError(
          response.status,
          response.statusText,
          responseText
        );
      }

      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } catch (e: any) {
      throw e;
    }
  }

  public get(path: string) {
    return this._call(path, "GET");
  }

  public post(path: string, data: any) {
    return this._call(path, "POST", data);
  }
}
