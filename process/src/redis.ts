import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
const redis = createClient({
  url: REDIS_URL,
  database: 0,
  disableOfflineQueue: true,
  isolationPoolOptions: {
    max: 10,
    min: 5,
  },
});

async function connect() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

async function disconnect() {
  return await redis.disconnect();
}

async function getNewConnection() {
  return await redis.executeIsolated(async (client) => client);
}

export default { connect, disconnect, getNewConnection };
