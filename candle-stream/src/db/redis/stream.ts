import { BaseRedisRepository } from "./base";
import { IStreamRepository } from "./interface";
import { RedisClientType } from "redis";

export class StreamRepository
  extends BaseRedisRepository
  implements IStreamRepository
{
  constructor(redis: RedisClientType<any, any, any>) {
    super(redis);
  }

  async append(stream: string, data: any) {
    let key = this.key(stream);
    await this._client.xAdd(key, "*", data);
  }
}
