import { BaseWorker } from "./base";
import { BinanceBroker } from "@shared/broker";
import { ISymbolModle } from "../db/mongodb/interface";
import { Timeframes } from "@shared/constants/timeframes";
import { IStreamRepository } from "../db/redis/interface";

export class BinanceCandleWorker extends BaseWorker {
  private _repo: ISymbolModle;
  constructor(
    repository: ISymbolModle,
    broker: BinanceBroker,
    stream: IStreamRepository,
    tf: Timeframes
  ) {
    super(stream, broker, tf);
    this._repo = repository;
  }

  async callback(stream: string) {
    this._logger.info("Task Started");

    this._broker.on("error", (err) => {
      this._logger.error(err);
    });

    this._broker.on("data", async (data) => {
      await Promise.allSettled(data.map((c) => this._stream.append(stream, c)));
    });

    this._broker.on("empty", async (msg) => {
      this._logger.error(msg);
    });

    // make requests
    const symbols = await this._repo.find({
      status: "UNLOCK",
      timeframe: this._timeframe,
    });
    symbols.map((sym) => {
      this._broker.request(sym.symbol, this._timeframe, sym.no, sym.nc);
    });
  }
}
