import { Signale } from "signale";
import { Broker } from "@shared/broker/base";
import { Timeframes } from "@shared/constants/timeframes";
// import { IStreamRepository } from "../db/redis/interface";

// export abstract class BaseWorker {
//   protected _stream: IStreamRepository;
//   protected _broker: Broker;
//   protected _logger: Signale;
//   protected _timeframe: Timeframes;

//   constructor(
//     stream: IStreamRepository,
//     broker: Broker,
//     timeframe: Timeframes
//   ) {
//     this._stream = stream;
//     this._broker = broker;
//     this._timeframe = timeframe;

//     this._logger = new Signale({
//       config: { displayTimestamp: true },
//       scope: "Worker",
//     });
//   }

//   abstract callback(stream: string): Promise<any>;
// }
