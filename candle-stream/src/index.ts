import "module-alias/register";

// ----- set env
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import * as nats from "nats";
import logger from "@shared/log";
import { worker } from "./worker";
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
  const NATS_HOST = process.env.NATS_HOST;
  const NATS_PORT = +process.env.NATS_PORT;
  const natsServer = await nats.connect({
    servers: `${NATS_HOST}:${NATS_PORT}`,
    reconnect: true,
    maxReconnectAttempts: 10,
  });
  logger.info("Connect to nats");

  /** Schedules */
  schedule
    .scheduleJob("0 * * * *", async () => {
      try {
        await worker(natsServer, Timeframes.OneHour)();
      } catch (error) {
        console.log("error");
      }
    })
    .invoke();

  /** << subscribes >> */
  natsServer.subscribe("binance-spot.stream.ack", {
    callback: async (err, mess) => {
      let sc = nats.StringCodec();
      logger.success("Ack recived " + sc.decode(mess.data));
    },
  });

  logger.warn(`/!\\ Timezone must be UTC - Now: ${new Date().toISOString()}`);
}
bootstrap();
