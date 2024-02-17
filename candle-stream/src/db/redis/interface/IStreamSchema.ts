type IAppendStream = {
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

interface IStreamRepository {
  append(stream: string, data: IAppendStream): Promise<void>;
}

export { IStreamRepository };
