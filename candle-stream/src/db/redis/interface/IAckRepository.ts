interface IAckRepository {
  set(stream: string, timeframe: string): Promise<void>;
  get(stream: string): Promise<string | null>;
}

export { IAckRepository };
