import { Model } from "mongoose";

interface ISymbolSchema {
  symbol: string;
  timeframe: string;
  status: "LOCK" | "UNLOCK";
  broker: "BINANCE";
  no: number;
  nc: number;
}

type ISymbolModle = Model<ISymbolSchema & Document>;

export { ISymbolSchema, ISymbolModle };
