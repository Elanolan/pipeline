import logger from "./shared/log";
import { KlineRepository } from "./db/influxdb";
import { InfluxDB } from "@influxdata/influxdb-client";
import * as nats from "nats";

async function bootstrap() {
  /** InfluxDB */
  const ORG_ID = process.env.INFLUX_ORGID;
  const BUCKET = process.env.INFLUX_BUCKET;
  const influxClient = new InfluxDB({
    url: process.env.INFLUX_URL,
    token: process.env.INFLUX_TOKEN,
    writeOptions: {
      batchSize: 1000,
      maxRetries: 0,
      flushInterval: 0,
      maxBufferLines: 1000,
    },
  });

  /** Nats */
  const NATS_HOST = process.env.NATS_HOST;
  const NATS_PORT = +process.env.NATS_PORT;
  const natsServer = await nats.connect({
    servers: `${NATS_HOST}:${NATS_PORT}`,
    reconnect: true,
    maxReconnectAttempts: 10,
  });
  logger.info("Connect to nats");

  /** Add Consumers and Streams */
  const streamManager = await natsServer.jetstreamManager({});
  await streamManager.streams.delete("binance-spot:stream");

  await streamManager.streams.add({
    name: "binance-spot:stream",
    max_age: 5e10,
    subjects: ["stream-candle.1h", "stream-candle.4h", "stream-candle.1d"],
    no_ack: false,
    storage: nats.StorageType.Memory,
    max_msgs: -1,
  });

  await streamManager.consumers.add("binance-spot:stream", {
    name: "c:stream-candle:1h",
    ack_policy: nats.AckPolicy.Explicit,
    filter_subjects: ["stream-candle.1h"],
  });

  /** Consumers */
  const jeststream = natsServer.jetstream({});
  const WriteAPIsMap = new Map<string, KlineRepository>();
  const CountMap = new Map<string, number>();

  jeststream.consumers
    .get("binance-spot:stream", "c:stream-candle:1h")
    .then((consumer) => {
      const sc = nats.StringCodec();
      consumer.consume({
        callback: async (message) => {
          const stream = message.info.stream;

          // write data to influx buffer
          const data = JSON.parse(sc.decode(message.data));
          WriteAPIsMap.get(stream).write([data]);

          // ack the message
          message.ack();
          let count = CountMap.get(stream);
          if (count <= 1) {
            // save data to influx
            await WriteAPIsMap.get(stream).end();
            WriteAPIsMap.delete(stream);
            logger.success("Save data successfully");
          } else {
            CountMap.set(message.info.stream, count - 1);
          }
        },
      });
    });

  /** Subscribers */
  natsServer.subscribe("binance-spot.stream.start", {
    callback: async (err, mess) => {
      console.log("Starting...");

      const sc = nats.StringCodec();
      const { stream, count } = JSON.parse(sc.decode(mess.data));

      const kline = new KlineRepository(
        influxClient.getWriteApi(ORG_ID, BUCKET, "ms")
      );

      kline.on("end", async () => {
        natsServer.publish("binance-spot.stream.ack", sc.encode("ACK!"));
      });

      kline.on("error", (err) => {
        logger.error(err);
      });

      CountMap.set(stream, count);
      WriteAPIsMap.set(stream, kline);
    },
  });

  logger.info("Write Hub services is running");
}
bootstrap();
