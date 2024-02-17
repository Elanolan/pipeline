import * as redis from "redis";
import logger from "./shared/log";
import { Consumer } from "./db/redis";
import { KlineRepository } from "./db/influxdb";
import { InfluxDB } from "@influxdata/influxdb-client";
import * as nats from "nats";

async function bootstrap() {
  /** Redis */
  const redisServer = redis.createClient({
    url: process.env.REDIS_URL,
    disableOfflineQueue: false,
    isolationPoolOptions: {
      max: 10,
      min: 5,
    },
  });
  await redisServer.connect();
  logger.info("Connect to redis");

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
  const natsServer = await nats.connect({
    port: 4222,
    reconnect: true,
    maxReconnectAttempts: 10,
  });
  logger.info("Connect to nats");

  const sc = nats.StringCodec();
  let consumers = new Map<string, Consumer>();

  /** Consumers */
  natsServer.subscribe("stream.listen", {
    callback: async (err, message) => {
      const { stream } = JSON.parse(sc.decode(message.data));

      let consumer = new Consumer(redisServer, stream);
      const kline = new KlineRepository(
        influxClient.getWriteApi(ORG_ID, BUCKET, "ms")
      );

      consumer.on("start", () => {
        logger.info(`start consuming stream ${stream}`);
      });

      consumer.on("data", (buf: Buffer) => {
        console.log(buf);
        const data = JSON.parse(buf.toString());
        kline.write(data);
      });

      consumer.on("end", async () => {
        await kline.end();
      });

      consumer.on("error", (err) => {
        logger.error(err);
      });

      kline.on("end", async () => {
        natsServer.publish("stream.ack", sc.encode(JSON.stringify({ stream })));
        logger.info(`end consuming stream ${stream}`);
      });

      kline.on("error", (err) => {
        logger.error(err);
      });

      await consumer.start();
      consumers.set(stream, consumer);
    },
  });

  natsServer.subscribe("stream.end", {
    callback: async (err, mess) => {
      const { stream } = JSON.parse(sc.decode(mess.data));
      if (!consumers.has(stream)) return;
      consumers.get(stream).end();
      consumers.delete(stream);
    },
  });

  logger.info("Write Hub services is running");
}
bootstrap();
