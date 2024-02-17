import * as https from "https";
import { EventEmitter } from "stream";

enum Events {
  DATA = "data",
  ERROR = "error",
  END = "end",
}

export class BinanceAPI extends EventEmitter {
  private _MAX_SOCKETS: number;
  private _IS_OPEN: boolean;

  private _url: URL;
  private _agent: https.Agent;
  private _request_pool: Array<Promise<any>>;

  constructor(url: string) {
    super();

    this._request_pool = [];
    this._MAX_SOCKETS = 100;
    this._IS_OPEN = true;
    this._url = new URL(url);
    this._agent = new https.Agent({
      keepAlive: true,
      maxSockets: this._MAX_SOCKETS,
    });
  }

  request(symbol: string, timeframe: string, limit: number) {
    if (!this._IS_OPEN) {
      throw new Error("BinanceAPI is closed");
    }

    const promise = new Promise((resolve, reject) => {
      const request = https.request({
        hostname: this._url.hostname,
        path: `${this._url.pathname}?symbol=${symbol}&interval=${timeframe}&limit=${limit}`,
        agent: this._agent,
        method: "GET",
      });

      request.on("response", (response) => {
        let chucks = "";
        response.on("data", (chunk) => (chucks += chunk));

        response.on("error", (err) => {
          this.emit(Events.ERROR, err?.message);
        });

        response.on("end", () => {
          const data = this.parse(JSON.parse(chucks)).map((candle) => ({
            ...candle,
            symbol,
            timeframe,
          }));

          this.emit(Events.DATA, data);
          resolve(true);
        });
      });

      request.on("error", (err) => {
        this.emit(Events.ERROR, err?.message);
      });

      request.on("timeout", () => {
        this.emit(Events.ERROR, "Request timedout");
      });

      request.end();
    });

    this._request_pool.push(promise);
  }

  async end() {
    try {
      await Promise.allSettled(this._request_pool);
      this._agent.destroy();
      this._IS_OPEN = false;
      this.emit(Events.END);
    } catch (err) {
      this.emit(Events.ERROR, err?.message);
    }
  }

  private parse(response: any[][]) {
    return response.map((candle) => {
      const [
        openTime,
        openPrice,
        high,
        low,
        closePrice,
        volume,
        closeTime,
        quoteAssetVolume,
        numberOfTrades,
        takerBuyBaseAssetVolume,
        takerBuyQuoteAssetVolume,
        ignore,
      ] = candle;

      return {
        openTime: String(openTime),
        openPrice,
        high,
        low,
        closePrice,
        volume,
        closeTime: String(closeTime),
        quoteAssetVolume,
        numberOfTrades: String(numberOfTrades),
        takerBuyBaseAssetVolume,
        takerBuyQuoteAssetVolume,
        ignore,
      };
    });
  }
}
