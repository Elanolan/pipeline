const url =
  "https://api.binance.com/api/v3/klines?symbol=POWRUSDT&interval=1h&startTime=1707901200000&endTime=1707904799999";

fetch(url, {}).then(console.log);
