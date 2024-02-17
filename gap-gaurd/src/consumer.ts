import { connect, StringCodec } from "nats";

connect({
  port: 4222,
  reconnect: true,
  maxReconnectAttempts: 10,
})
  .then(async (nats) => {
    const sd = StringCodec();
    nats.publish("stream.listen", sd.encode("hello"));

    const sub = nats.subscribe("ack");
    for await (let m of sub) {
      console.log(sd.decode(m.data));
    }
  })
  .catch((err) => {
    console.log(err);
  });
