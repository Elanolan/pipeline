import * as redis from "redis";

let client = redis.createClient({
  url: "redis://localhost:6379/",
});

async function main() {
  await client.connect();
  // console.log(await client.subscribe("test", () => {}));
  await client.executeIsolated(async function (c) {
    console.log(await c.subscribe("test", () => {}));
  });
  console.log(await client.set("name", "alireza"));
}
main();
