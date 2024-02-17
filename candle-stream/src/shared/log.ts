import { Signale } from "signale";

const logger = new Signale({
  config: { displayTimestamp: true },
  scope: "Global",
});

export default logger;
