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
      name: "1h:consumer",
      ack_policy: AckPolicy.None,
      deliver_policy: DeliverPolicy.All,
      filter_subjects: ["1h.candle"],
    });

    await streamManager.consumers.add("candles", {
      name: "4h:consumer",
      ack_policy: AckPolicy.None,
      deliver_policy: DeliverPolicy.All,
      filter_subjects: ["4h.candle"],
    });

    await streamManager.consumers.add("candles", {
      name: "1d:consumer",
      ack_policy: AckPolicy.None,
      deliver_policy: DeliverPolicy.All,
      filter_subjects: ["1d.candle"],
    });

    const streamClient = nats.jetstream({});

    streamClient.consumers
      .get("candles", "1h:consumer")
      .then(async (consumer) => {
        await consumer.consume({
          callback: (r) => {
            console.log(sd.decode(r.data));
          },
        });
      });

    streamClient.consumers
      .get("candles", "4h:consumer")
      .then(async (consumer) => {
        await consumer.consume({
          callback: (r) => {
            console.log(sd.decode(r.data));
          },
        });
      });

    streamClient.consumers
      .get("candles", "1d:consumer")
      .then(async (consumer) => {
        await consumer.consume({
          callback: (r) => {
            console.log(sd.decode(r.data));
          },
        });
      });
  })
  .catch((err) => {
    console.log(err);
  });
