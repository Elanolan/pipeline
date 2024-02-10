import * as https from "https";
import { EventEmitter } from "stream";

enum Events {
  DATA = "data",
}

export class BinanceAPI extends EventEmitter {
  private _MAX_SOCKETS: number;

  private _url: URL;
  private _pool: Array<Promise<any>>;
  private _agent: https.Agent;

  constructor(url: string) {
    super();

    this._pool = [];
    this._MAX_SOCKETS = 100;
    this._url = new URL(url);
    this._agent = new https.Agent({
      keepAlive: true,
      maxSockets: this._MAX_SOCKETS,
    });
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
      };
    });
  }

  request(symbol: string, timeframe: string, limit: number) {
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
        response.on("error", (err) => reject(err.message));

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
        reject(err.message);
      });

      request.on("timeout", () => {
        reject("ERROR: Request timedout");
      });

      request.end();
    });

    this._pool.push(promise);
  }

  async end() {
    await Promise.allSettled(this._pool);
    this._agent.destroy();
  }
}
