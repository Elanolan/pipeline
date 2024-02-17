type IWriteKline = {
  symbol: string;
  timeframe: string;
  open: string;
  close: string;
  openTime: number;
  closeTime: number;
  high: string;
  low: string;
  volume: string;
  numberOfTrades: string;
  quoteAssetVolume: string;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
};

export interface IKlineRepository {
  write(input: IWriteKline[]): void;
}
