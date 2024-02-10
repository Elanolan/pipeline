import Redis from "./redis";
import { Consumer } from "./consumer";

async function main() {
  const redis = await Redis.connect();
  const consumers = new Map<string, Consumer>();

  redis.subscribe("start", async function (msg) {
    const { stream, group, consumer } = JSON.parse(msg);

    // NOTE: don't use current connection.
    // create new isolated connection instead.
    const client = await Redis.getNewConnection();

    let c = new Consumer(client, consumer, stream, group);

    c.on("start", () => {
      console.log("start consuming");
    });

    c.on("data", (buf: Buffer) => {
      console.log(buf.toString());
    });

    c.on("end", () => {
      console.log("end consuming");
    });

    c.on("error", (err) => {
      console.log(err);
    });

    await c.start();
    consumers.set(consumer, c);
  });

  redis.subscribe("end", async function (msg) {
    const { consumer } = JSON.parse(msg);

    // check consumer exists
    if (!consumers.has(consumer)) return;

    // end the consumer
    consumers.get(consumer).end();

    // delete from consumers
    consumers.delete(consumer);
  });
}
main();
