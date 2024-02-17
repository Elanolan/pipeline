import { AckPolicy, connect, DeliverPolicy, StringCodec } from "nats";

connect({
  port: 4222,
  reconnect: true,
  maxReconnectAttempts: 10,
})
  .then(async (nats) => {
    const sd = StringCodec();
    const streamManager = await nats.jetstreamManager({});
    await streamManager.consumers.add("candles", {
      name: "1h.consumer",
      ack_policy: AckPolicy.None,
      deliver_policy: DeliverPolicy.All,
      filter_subjects: ["1h.single"],
      max_batch: 10,
    });

    const streamClient = nats.jetstream({});
    streamClient.consumers.get("1h.consumer").then((consumer) => {
      console.log(consumer);

      consumer.consume({
        callback: (r) => {
          console.log(sd.decode(r.data));
        },
      });
    });
  })
  .catch((err) => {
    console.log(err);
  });
