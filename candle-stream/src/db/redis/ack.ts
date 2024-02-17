import { RedisClientType, commandOptions } from "redis";
import { BaseRedisRepository } from "./base";
import { IAckRepository } from "./interface";

export class AckRepository
  extends BaseRedisRepository
  implements IAckRepository
{
  constructor(client: RedisClientType<any, any, any>) {
    super(client, "ack");
  }

  async set(stream: string, timeframe: string) {
    try {
      await this._client.set(
        commandOptions({ isolated: true }),
        this.key(stream),
        timeframe
      );

      await this._client.expire(
        commandOptions({ isolated: true }),
        this.key(stream),
        60
      );
    } catch (error) {
      console.log(error);
    }
  }

  async get(stream: string) {
    return await this._client.get(this.key(stream));
  }
}
