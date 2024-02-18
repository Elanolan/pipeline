import { SymbolModel } from "./db/mongodb";
import { BinanceBroker } from "@shared/broker";
import { NatsConnection, StringCodec } from "nats";

export function worker(nats: NatsConnection, tf: string) {
  return async () => {
    const codec = StringCodec();
    const jetstream = nats.jetstream({});

    // get symbols
    const symbols = await SymbolModel.find({
      status: "UNLOCK",
      timeframe: tf,
    });

    // signal the start
    nats.publish(
      "binance-spot.stream.start",
      codec.encode(
        JSON.stringify({
          stream: "binance-spot:stream",
          count: symbols.length,
        })
      )
    );

    // create a broker
    let broker = new BinanceBroker();
    await broker.start();

    // adding data to stream
    broker.on("data", async (data) => {
      try {
        await jetstream.publish(
          `stream-candle.${tf}`,
          codec.encode(JSON.stringify(data))
        );
        console.log("publishd");
      } catch (error) {
        console.log("error ", error?.message);
      }
    });

    // make requests
    symbols.map((sym) => {
      broker.request(sym.symbol, sym.timeframe, sym.no, sym.nc);
    });

    // kill broker
    await broker.end();

    // signal the end
    nats.publish(
      "binance-spot.stream.end",
      codec.encode(JSON.stringify({ stream: "binance-spot:stream" }))
    );
  };
}
