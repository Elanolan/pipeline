import { connect, StringCodec } from "nats";

connect({
  port: 4222,
  reconnect: true,
  maxReconnectAttempts: 10,
}).then(async (nats) => {
  console.log("connect");

  const sd = StringCodec();
  const streamManager = await nats.jetstreamManager({});
  console.log("manager created");

  console.log(await streamManager.streams.info("candles"));

  // await streamManager.streams.delete("candles");
  // await streamManager.streams.add({
  //   name: "candles",
  //   max_age: 1.5e10,
  //   subjects: ["1h.single", "4h.single", "1d.single"],
  // });
  // console.log("add stream");

  const streamClient = nats.jetstream({});
  setInterval(async () => {
    await streamClient.publish(
      "1h.single",
      sd.encode(`{"max":1200,"min":900,"tf":"1h"}`)
    );

    await streamClient.publish(
      "4h.single",
      sd.encode(`{"max":1200,"min":900,"tf":"4h"}`),
      {}
    );

    await streamClient.publish(
      "1d.single",
      sd.encode(`{"max":1200,"min":900,"tf":"1d"}`)
    );
  }, 10000);
  // .catch((err) => {
  //   console.log("timeout! ", err);
});
