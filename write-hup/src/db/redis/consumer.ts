import * as async from "async";
import { RedisClientType } from "redis";
import { EventEmitter } from "node:events";
import { IConsumer } from "./interface";

enum Events {
  START = "start",
  END = "end",
  DATA = "data",
  ERROR = "error",
  GROUP_CREATED = "group-created",
  STREAM_CREATED = "stream-created",
}

class Consumer extends EventEmitter implements IConsumer {
  /**
   * @description number of milliseconds
   * @default 5000
   */
  private _BLOCK_TIME: number;

  /**
   * @description number of messages for each consumption
   * @default 10
   */
  private _BATCH_SIZE: number;

  /**
   * @description maximum length of stream
   * @default 1000
   */
  private _STREAM_SIZE: number;

  /**
   * @description consumer status
   * @default true
   */
  private _IS_ALIVE: boolean;

  /**
   * @description number of empty messages after each blocking.
   * @default 10
   */
  private _EMPTY_ATTEMPTS: number;

  /**
   * @description redis client. note that client should be isolated.
   */
  private _redis: RedisClientType<any, any, any>;

  /**
   * @description stream name
   */
  private _stream: string;

  /**
   * @description group name
   */
  private _group: string = "influx";

  /**
   * @description group name
   */
  private _consumer: string = "c1";

  constructor(redis: RedisClientType<any, any, any>, stream: string) {
    super();

    this._BLOCK_TIME = 3e3; // 5 sec
    this._BATCH_SIZE = 10; // 10 message
    this._STREAM_SIZE = 1000; // maximum of 1000 messages
    this._IS_ALIVE = true;
    this._EMPTY_ATTEMPTS = 10;
    this._redis = redis;
    this._stream = stream;
  }

  private async checkStreamExists() {
    try {
      return (await this._redis.exists(this._stream)) == 1;
    } catch (error) {
      this.emit(Events.ERROR, "Error: " + error?.message);
    }
  }

  private async createStream() {
    try {
      await this._redis
        .multi()
        .xAdd(
          this._stream,
          "*",
          { test: "" },
          {
            TRIM: {
              strategy: "MAXLEN",
              strategyModifier: "~",
              threshold: this._STREAM_SIZE,
            },
          }
        )
        .xTrim(this._stream, "MAXLEN", 0)
        .exec();
    } catch (error) {
      this.emit(Events.ERROR, "Error: " + error?.message);
    }
  }

  private async checkGroupExists() {
    try {
      const groups = await this._redis.xInfoGroups(this._stream);
      return groups.map((g) => g.name).includes(this._group);
    } catch (error) {
      this.emit(Events.ERROR, "Error: " + error?.message);
    }
  }

  private async createGroup() {
    try {
      await this._redis.xGroupCreate(this._stream, this._group, "0");
    } catch (error) {
      this.emit(Events.ERROR, "Error: " + error?.message);
    }
  }

  private async cleanup() {
    try {
      await this._redis.del(this._stream);
    } catch (error) {
      this.emit(Events.ERROR, "Error: " + error?.message);
    }
  }

  private async consume() {
    let messages = await this._redis.xReadGroup(
      this._group,
      this._consumer,
      { id: ">", key: this._stream },
      { BLOCK: this._BLOCK_TIME, COUNT: this._BATCH_SIZE }
    );
    return messages ? messages[0].messages : null;
  }

  async start() {
    if (!this._IS_ALIVE) {
      this.emit(Events.ERROR, "Stream has been dead!");
      return;
    }

    // create stream if not exists
    const isStreamExists = await this.checkStreamExists();
    if (!isStreamExists) {
      await this.createStream();
      this.emit(Events.STREAM_CREATED, { stream: this._stream });
    }

    // create consumer group if not exists
    const isConsumergroupExists = await this.checkGroupExists();
    if (!isConsumergroupExists) {
      await this.createGroup();
      this.emit(Events.GROUP_CREATED, { group: this._group });
    }

    // consume
    let emptyAttempts = 0;
    async.forever(
      (next) => {
        // check idle time exceed the limit
        if (emptyAttempts >= this._EMPTY_ATTEMPTS) {
          this.cleanup().then(() => this.emit(Events.END));
          return;
        }

        this.consume()
          .then((v) => {
            // avoid emitting null data
            if (v) {
              this.emit(
                Events.DATA,
                Buffer.from(JSON.stringify(v.map((v) => v.message)))
              );
              emptyAttempts = 0;
            } else {
              emptyAttempts += 1;
            }
            next();
          })
          .catch((err) => {
            next(err);
          });
      },
      (err) => {
        this.emit(Events.ERROR, "Error: " + err?.message);
      }
    );

    this.emit(Events.START);
  }

  end() {
    if (!this._IS_ALIVE) {
      this.emit(Events.ERROR, "Consumer has already been dead!");
      return;
    }

    this._IS_ALIVE = false;
    this._EMPTY_ATTEMPTS = 1;
  }
}

export { Consumer };
