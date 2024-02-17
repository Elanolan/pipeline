import * as https from "https";
import { Broker } from "./base";
import logger from "../../shared/log";
import { BINANCE_KLINE_API } from "@shared/constants/apis";

enum Events {
  DATA = "data",
  ERROR = "error",
}

export class BinanceBroker extends Broker {
  private _IS_OPEN: boolean;
  private _MAX_SOCKETS: number;

  private _agent: https.Agent;
  private _request_pool: Array<Promise<any>>;

  constructor() {
    super("BINANCE", BINANCE_KLINE_API, 1000);

    this._IS_OPEN = false;
    this._MAX_SOCKETS = 100;
    this._request_pool = [];
  }

  request(s: string, t: string, o: number, c: number) {
    if (!this._IS_OPEN) {
      this.emit(Events.ERROR, "BinanceBroker is closed");
      return;
    }

    const promise = new Promise((resolve, reject) => {
      const request = https.request({
        hostname: this._api.hostname,
        path: `${this._api.pathname}?symbol=${s}&interval=${t}&startTime=${o}&endTime=${c}`,
        agent: this._agent,
        method: "GET",
      });

      request.on("response", (response) => {
        let chucks = "";
        response.on("data", (chunk) => (chucks += chunk));

        response.on("end", () => {
          chucks = JSON.parse(chucks || "[]");
          if (!chucks.length) {
            logger.warn(`Binance returns no data for symbol ${s}`);
            return reject(false);
          }

          const data = this.parse(chucks as any).map((candle) => ({
            ...candle,
            symbol: s,
            timeframe: t,
          }));

          this.emit(Events.DATA, data[0]);
          resolve(true);
        });
      });

      request.on("error", (err) => {
        console.log(err);
        return reject(false);
      });

      request.on("timeout", () => {
        logger.error("Request timedout");
        reject(false);
      });

      request.end();
    });

    this._request_pool.push(promise);
  }

  async start() {
    if (this._IS_OPEN) {
      logger.info("BinanceBroker has already been opened");
      return;
    }

    this._agent = new https.Agent({
      keepAlive: true,
      maxSockets: this._MAX_SOCKETS,
    });
    this._IS_OPEN = true;
  }

  async end() {
    if (!this._IS_OPEN) {
      logger.info("BinanceBroker has already been closed");
      return;
    }

    await Promise.allSettled(this._request_pool);
    this._agent.destroy();
    this._IS_OPEN = false;
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
