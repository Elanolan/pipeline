import {
  InfluxDB,
  LineSplitter,
  Point,
  chunksToLines,
  stringToLines,
  linesToTables,
  Row,
  linesToRowsIterable,
  WriteApi,
} from "@influxdata/influxdb-client";

export function toJson(input: any) {
  return input.map((candle) => {
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
      symbol: "BTCETH",
      timeframe: "1h",
    };
  });
}

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

function protocolLienToJson(line: string) {
  const [measurementAndTags, fields, timestamp] = line.split(" ");

  // convert to a object
  let [measurement, t1, t2] = measurementAndTags.split(",");
  const json = [t1, t2, ...fields.split(",")]
    .map((f) => {
      const [field, value] = f.split("=");
      return { [field]: value.replace(/"/g, "") };
    })
    .reduce((prev, curr) => ({ ...prev, ...curr, measurement, timestamp }));

  return json;
}

async function main() {
  const influx = new InfluxDB({
    url: "http://localhost:8086",
    token:
      "eAuvaGIrtS1tH15cpRg2wHtJ-74kDm3ehpkeF01VSODotr955lqIclWfjKFvSqKN85oYN1mM30pba6FlpxzA2w==",
    writeOptions: {
      maxRetries: 0,
      flushInterval: 0,
    },
  });

  const writeAPI = influx.getWriteApi("9760a260aaf53a2f", "Klines", "ms", {
    writeSuccess(lines) {
      const points = lines.map(protocolLienToJson);
      console.log(points.map((p) => ({ t: p.timeframe, s: p.symbol })));
    },
    batchSize: 50,
    flushInterval: 0,
    maxRetries: 0,
  });

  let i = 0;
  while (i < 300) {
    writeAPI.writePoint(
      new Point("server")
        .tag("host", "local")
        .tag("tz", "utc")
        .stringField("cpu", "12.2")
        .timestamp(Date.now() + i)
    );
    i++;
  }
  console.log(">>>>>>>>>>>>>>>>>");
  console.time("start");
  await writeAPI.flush();
  await writeAPI.close();
  console.timeEnd("start");
}
main();
