import { InfluxDB } from "@influxdata/influxdb-client";

async function main() {
  const influx = new InfluxDB({
    url: "http://localhost:8086",
    token:
      "qzSgDuLfwWpCOaIVosEs_dWx-yikjJVRLIOIS0Je2HVy38CPvT-Gib5tCEJ20YcxmGYnNFKEDJhzneNgQHRjEA==",
    writeOptions: {
      batchSize: 1000,
      maxRetries: 0,
      writeFailed(error, lines, attempt, expires) {
        console.log(error.message);
        console.log(lines);
      },
      writeSuccess(lines) {
        console.log(lines);
      },
    },
  });
  influx.getWriteApi();
}
