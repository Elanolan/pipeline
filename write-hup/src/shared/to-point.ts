import { Point } from "@influxdata/influxdb-client";

export function toPoint(input: any) {
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
