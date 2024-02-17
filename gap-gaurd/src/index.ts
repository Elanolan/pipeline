import { connect, StringCodec } from "nats";

connect({
  port: 4222,
  reconnect: true,
  maxReconnectAttempts: 10,
  debug: true,
  timeout: 30000,
})
  .then(async (nats) => {
    const sd = StringCodec();
    const streamManager = await nats.jetstreamManager({});
    console.log("here");

    await streamManager.streams.add({
      name: "candles",
      max_age: 1.5e10,
      subjects: ["1h.*", "4h.*", "1d.*"],
    });
    console.log("add stream");

    const streamClient = nats.jetstream({});
    await streamClient.publish(
      "1h.single",
      sd.encode(`{"max":1200,"min":900}`)
    );
  })
  .catch((err) => {
    console.log("timeout! ", err?.message);
  });
