import "module-alias/register";

// ----- set env
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import * as nats from "nats";
import logger from "@shared/log";
import { worker } from "./workers";
import schedule from "node-schedule";
import { Timeframes } from "@shared/constants/timeframes";

async function bootstrap() {
  /** Mongodb */
  await mongoose.connect(process.env.MONGO_URL, {
    maxPoolSize: 20,
    minPoolSize: 5,
  });
  logger.info("Connect to mongodb");

  /** Nats */
  const natsServer = await nats.connect({
    port: 4222,
    reconnect: true,
    maxReconnectAttempts: 10,
  });
  logger.info("Connect to nats");

  schedule
    .scheduleJob("0 * * * *", worker(natsServer, Timeframes.OneHour))
    .invoke();

  /** << subscribes >> */
  natsServer.subscribe("ack", {
    callback: async (err, mess) => {
      let sc = nats.StringCodec();
      logger.success("Ack recived for stream " + sc.decode(mess.data));
    },
  });

  logger.warn(`/!\\ Timezone must be UTC - Now: ${new Date().toISOString()}`);
}
bootstrap();
