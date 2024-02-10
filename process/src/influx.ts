import { InfluxDB } from "@influxdata/influxdb-client";

const INFLUX_URL = process.env.INFLUX_URL;
const INFLUX_TOKEN = process.env.INFLUX_TOKEN;
const INFLUX_ORGID = process.env.INFLUX_ORGID;
const INFLUX_BUCKET = process.env.INFLUX_BUCKET;

const influx = new InfluxDB({
  url: INFLUX_URL,
  token: INFLUX_TOKEN,
  writeOptions: {
    batchSize: 1000,
    flushInterval: 0,
    maxRetries: 0,
  },
});

function createWriteApi() {
  return influx.getWriteApi(INFLUX_ORGID, INFLUX_BUCKET, "ms");
}

export default { createWriteApi };
