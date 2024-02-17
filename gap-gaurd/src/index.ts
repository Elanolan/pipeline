import { connect, StringCodec } from "nats";

connect({
  port: 4222,
  reconnect: true,
  maxReconnectAttempts: 10,
})
  .then(async (nats) => {
    const sd = StringCodec();

    const sub = nats.subscribe("stream.listen", {
      callback: (err, msg) => {
        console.log(sd.decode(msg.data));
        nats.publish("ack", sd.encode("acknolllllll"));
      },
    });
  })
  .catch((err) => {
    console.log(err);
  });
