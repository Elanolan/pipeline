import { Schema, model } from "mongoose";
import { ISymbolSchema } from "./interface";
const Types = Schema.Types;

const SymbolSchema = new Schema<ISymbolSchema>(
  {
    symbol: { type: Types.String, required: true },
    timeframe: { type: Types.String, required: true },
    status: { type: Types.String, enum: ["LOCK", "UNLOCK"], required: true },
    broker: { type: Types.String, enum: ["BINANCE"], default: "BINANCE" },
    no: { type: Types.Number, required: true }, // next opentime
    nc: { type: Types.Number, required: true }, // next closetime
  },
  { versionKey: false, timestamps: false }
);

const SymbolModel = model<ISymbolSchema & Document>("symbols", SymbolSchema);
export { SymbolModel };
