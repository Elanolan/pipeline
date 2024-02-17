import { randomUUID } from "crypto";
import { RedisClientType } from "redis";
import { SymbolModel } from "../db/mongodb";
import { BinanceBroker } from "@shared/broker";
import { NatsConnection, StringCodec } from "nats";
import { AckRepository, StreamRepository } from "../db/redis";

export function worker(
  redis: RedisClientType<any, any, any>,
  nats: NatsConnection,
  tf: string
) {
  return async () => {
    const codec = StringCodec();

    // create a broker
    let broker = new BinanceBroker();
    await broker.start();

    // send a signal to start consuming
    let stream: string = randomUUID();
    nats.publish("stream.listen", codec.encode(JSON.stringify({ stream })));

    // create a stream
    let streamRepository = new StreamRepository(redis);
    let ackRepository = new AckRepository(redis);

    // save a session
    await ackRepository.set(stream, tf);

    // adding data to stream
    broker.on("data", async (data) => {
      await Promise.allSettled([streamRepository.append(stream, data[0])]);
    });

    // make requests
    const symbols = await SymbolModel.find({
      status: "UNLOCK",
      timeframe: tf,
    });
    symbols.map((sym) => {
      broker.request(sym.symbol, sym.timeframe, sym.no, sym.nc);
    });

    // send a signal to end consuming
    nats.publish("stream.end", codec.encode(JSON.stringify({ stream })));

    // kill broker
    await broker.end();
  };
}
