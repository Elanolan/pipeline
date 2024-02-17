import { Point, WriteApi } from "@influxdata/influxdb-client";
import { IKlineRepository } from "./interface";
import { EventEmitter } from "node:stream";

enum Events {
  ERROR = "error",
  END = "end",
}

export class KlineRepository extends EventEmitter implements IKlineRepository {
  private _api: WriteApi;
  constructor(api: WriteApi) {
    super();

    this._api = api;
  }

  write(input: any[]) {
    try {
      input = input.map((data) => this.toPoint(data));
      this._api.writePoints(input);
    } catch (error) {
      this.emit(Events.ERROR, "Cannot convert data to point");
    }
  }

  async end() {
    try {
      await this._api.flush();
      await this._api.close();
      this.emit(Events.END, "Successfully write data");
    } catch (error) {
      this.emit(Events.ERROR, "Cannot write data: " + error?.message);
    }
  }

  private toPoint(input: any) {
    return new Point("binance_spot")
      .tag("symbol", input.symbol)
      .tag("timeframe", input.timeframe)
      .stringField("open", input.open)
      .stringField("close", input.close)
      .stringField("openTime", input.openTime)
      .stringField("closeTime", input.closeTime)
      .stringField("high", input.high)
      .stringField("low", input.low)
      .stringField("volume", input.volume)
      .stringField("numberOfTrades", input.numberOfTrades)
      .stringField("quoteAssetVolume", input.quoteAssetVolume)
      .stringField("takerBuyBaseAssetVolume", input.takerBuyBaseAssetVolume)
      .stringField("takerBuyQuoteAssetVolume", input.takerBuyQuoteAssetVolume)
      .timestamp(new Date(+input.openTime));
  }
}
