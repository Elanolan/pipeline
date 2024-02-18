<h2 style='text-align: center;'>Write Hub</h2>

## ENV

create a `.env` file in the root and set bellow variables:

```env
TZ='UTC'

######################## 
######## Influx ########
######################## 
INFLUX_URL=''
INFLUX_ORGID=''
INFLUX_TOKEN=''
INFLUX_BUCKET=''

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