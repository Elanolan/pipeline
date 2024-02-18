<h2 style='text-align: center;'>Candle Stream</h2>

## Overview

#### Stream and Consumers

- binance-spot:stream

  - consumer `c:stream-candle:1h` > subject `stream-candle.1h`
  - consumer `c:stream-candle:4h` > subject `stream-candle.4h`
  - consumer `c:stream-candle:1d` > subject `stream-candle.1d`

#### Pub/Sub

- for steram `binance-spot:stream` > subjects `binance-spot.stream.ack`, `binance-spot.stream.start`

## ENV

create a `.env` file in the root and set bellow variables:

```env
TZ='UTC' # don't chagne it!

##########################
######## Database ########
##########################
MONGO_URL=''

##########################
########## Nats ##########
##########################
NATS_PORT=''
NATS_HOST=''
```

## Run

to start project just run following command:

```
npm run start
```

## Prerequisite

- node `+v18`
- nats `+v2`
- mongodb `+v7`