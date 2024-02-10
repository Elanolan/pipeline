import { createClient } from "redis";
import * as symbols from "../symbols.json";
import { BinanceAPI } from "./libs/binance-api";

const REDIS_URL = process.env.REDIS_URL;
async function main() {
  const redis = createClient({ url: REDIS_URL });
  await redis.connect();

  redis
    .publish(
      "start",
      JSON.stringify({ stream: "binance", group: "write", consumer: "1" })
    )
    .then(async (listeners) => {
      let binance = new BinanceAPI(process.env.BINANCE_API);
      for (let s of (symbols as any).default) {
        binance.request(s, "1h", 1);
        binance.request(s, "4h", 1);
        binance.request(s, "1d", 1);
      }

      binance.on("data", (data) => {
        console.log(data);
      });

      try {
        console.time("request");
        await binance.end();
        console.timeEnd("request");
        await redis.publish("end", JSON.stringify({ consumer: "1" }));
      } catch (error) {
        console.log(error?.message);
      }
    });
}
main();
