import { RedisClientType } from "redis";

export abstract class BaseRedisRepository {
  protected _client: RedisClientType<any, any, any>;
  protected _prefix: string;

  constructor(client: RedisClientType<any, any, any>, prefix?: string) {
    this._client = client;
    this._prefix = prefix;
  }

  protected key(...value: string[]) {
    let key = this._prefix ? [this._prefix, ...value] : [...value];
    return key.join(":");
  }
}
