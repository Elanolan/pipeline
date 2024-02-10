import { createClient } from "redis";

async function main() {
  const redis = createClient({
    url: process.env.REDIS_URL,
  });
  await redis.connect();

  // let i = 0;
  // setInterval(async () => {
  //   await redis.xAdd(
  //     "binance",
  //     "*",
  //     { counter: String(i), symbol: "BTCUSDT" },
  //     {
  //       TRIM: {
  //         strategy: "MAXLEN",
  //         strategyModifier: "=",
  //         threshold: 100,
  //       },
  //     }
  //   );
  //   i++;
  // }, 200);

  redis
    .publish(
      "start",
      JSON.stringify({ stream: "binance", group: "write", consumer: "1" })
    )
    .then((v) => {
      console.log(v);
    });
}
main();
