import {
  AckPolicy,
  connect,
  DeliverPolicy,
  StorageType,
  StringCodec,
} from "nats";

connect({
  port: 4222,
  reconnect: true,
  maxReconnectAttempts: 10,
})
  .then(async (nats) => {
    const sd = StringCodec();
    const streamManager = await nats.jetstreamManager({});

    await streamManager.streams.add({
      name: "binance-spot:stream",
      max_age: 1.5e10,
      subjects: ["stream-candle.1h", "stream-candle.4h", "stream-candle.1d"],
      no_ack: true,
      storage: StorageType.Memory,
    });
    console.log("add stream");

    await streamManager.consumers.add("candles", {
      name: "1h:consumer",
      ack_policy: AckPolicy.None,
      deliver_policy: DeliverPolicy.All,
      filter_subjects: ["1h.single"],
    });

    const streamClient = nats.jetstream({});

    streamClient.consumers
      .get("candles", "1h:consumer")
      .then(async (consumer) => {
        let i = 0;
        await consumer.consume({
          callback: (r) => {
            i++;
            console.log(i);

            if (i == 145) {
              nats.publish(
                "binance-spot.stream.ack",
                sd.encode("ACKKKKKKKK!!!")
              );
              console.log("ack");
            }
          },
        });
      });

    // streamClient.consumers
    //   .get("candles", "4h:consumer")
    //   .then(async (consumer) => {
    //     await consumer.consume({
    //       callback: (r) => {
    //         console.log(sd.decode(r.data));
    //       },
    //     });
    //   });

    // streamClient.consumers
    //   .get("candles", "1d:consumer")
    //   .then(async (consumer) => {
    //     await consumer.consume({
    //       callback: (r) => {
    //         console.log(sd.decode(r.data));
    //       },
    //     });
    //   });
  })
  .catch((err) => {
    console.log(err);
  });
