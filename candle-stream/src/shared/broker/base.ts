import { EventEmitter } from "stream";

export abstract class Broker extends EventEmitter {
  protected _api: URL;
  protected _name: string;
  protected _max_limit: number;

  constructor(name: string, api: string, limit: number) {
    super();

    this._api = new URL(api);
    this._name = name;
    this._max_limit = limit;
  }

  abstract request(s: string, t: string, o: number, c: number): void;
  abstract start(): Promise<void>;
  abstract end(): Promise<void>;
}
