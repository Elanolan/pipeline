import { SymbolModel } from "../db/mongodb";
import { BinanceBroker } from "@shared/broker";
import { NatsConnection, StringCodec } from "nats";

export function worker(nats: NatsConnection, tf: string) {
  return async () => {
    const codec = StringCodec();

    // create a broker
    let broker = new BinanceBroker();
    await broker.start();

    // create a jetstream client
    const jetstream = nats.jetstream({});
    console.log("1");

    // adding data to stream
    broker.on("data", async (data) => {
      await jetstream.publish("1h.single", codec.encode(JSON.stringify(data)));
    });

    // make requests
    const symbols = await SymbolModel.find({
      status: "UNLOCK",
      timeframe: tf,
    });
    symbols.map((sym) => {
      broker.request(sym.symbol, sym.timeframe, sym.no, sym.nc);
    });

    // kill broker
    await broker.end();
  };
}
