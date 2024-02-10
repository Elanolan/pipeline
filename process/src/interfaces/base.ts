export type IWrite = {
  symbol: string;
  timeframe: string;
  close: string;
  closeTime: string;
  open: string;
  openTime: string;
  high: string;
  low: string;
  ignore: string;
  numberOfTrades: string;
  volume: string;
  quoteAssetVolume: string;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
};

export interface IStorage {
  write(measurement: string, data: IWrite | IWrite[]): void;
  close(): Promise<void>;
  isClosed(): boolean;
}

export interface IStorageFactory {
  (): IStorage;
}
