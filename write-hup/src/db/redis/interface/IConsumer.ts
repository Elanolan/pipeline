export interface IConsumer {
  start(): Promise<void>;
  end(): void;
}
