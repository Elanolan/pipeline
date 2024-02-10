import { Point } from "@influxdata/influxdb-client";

export function streamToPoint(message: any): Point {
  return new Point("binance_spot")
    .tag("symbol", message.symbol)
    .tag("timeframe", message.timeframe)
    .stringField("open", message.open)
    .stringField("close", message.close)
    .stringField("openTime", message.openTime)
    .stringField("closeTime", message.closeTime)
    .stringField("high", message.high)
    .stringField("low", message.low)
    .stringField("volume", message.volume)
    .stringField("numberOfTrades", message.numberOfTrades)
    .stringField("quoteAssetVolume", message.quoteAssetVolume)
    .stringField("takerBuyBaseAssetVolume", message.takerBuyBaseAssetVolume)
    .stringField("takerBuyQuoteAssetVolume", message.takerBuyQuoteAssetVolume)
    .timestamp(new Date(+message.openTime));
}
