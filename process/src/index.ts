import Redis from "./redis";
import { Consumer } from "./consumer";
import Influx from "./influx";
import { Point } from "@influxdata/influxdb-client";
import { streamToPoint } from "./streamToPoint";

async function main() {
  const redis = await Redis.connect();
  const consumers = new Map<string, Consumer>();

  redis.subscribe("start", async function (msg) {
    const { stream, group, consumer } = JSON.parse(msg);

    // NOTE: don't use current connection.
    // create new isolated connection instead.
    const client = await Redis.getNewConnection();

    let c = new Consumer(client, consumer, stream, group);
    const influx = Influx.createWriteApi();

    c.on("start", () => {
      console.log("start consuming");
    });

    c.on("data", (buf: Buffer) => {
      const data = JSON.parse(buf.toString()).map((data) =>
        streamToPoint(data.message)
      );
      influx.writePoints(data);
    });

    c.on("end", async () => {
      console.log("end consuming");
      await influx.flush();
      await influx.close();
      await redis.disconnect();
    });

    c.on("error", (err) => {
      console.log(err);
    });

    await c.start();
    consumers.set(consumer, c);
  });

  redis.subscribe("end", function (msg) {
    const { consumer } = JSON.parse(msg);

    // check consumer exists
    if (!consumers.has(consumer)) return;

    // end the consumer
    consumers.get(consumer).end();

    // delete from consumers
    consumers.delete(consumer);
  });

  console.log("Listening....");
}
main();
