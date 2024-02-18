## Stream and Consumers

- binance-spot:stream

  - consumer `c:stream-candle:1h` > subject `stream-candle.1h`
  - consumer `c:stream-candle:4h` > subject `stream-candle.4h`
  - consumer `c:stream-candle:1d` > subject `stream-candle.1d`

- binance-spot:gap
  - consumer `gap-candle:1h` > subject `gap-candle.1h`
  - consumer `gap-candle:4h` > subject `gap-candle.4h`
  - consumer `gap-candle:1d` > subject `gap-candle.1d`

## Ack subjects

- for `binance-spot:gap` -> `binance-spot.gap.ack`, `binance-spot.gap.start`
- for `binance-spot:stream` -> `binance-spot.stream.ack`, `binance-spot.stream.start`
