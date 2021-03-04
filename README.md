# 42api-aggregator-cron

42api-aggregator-cron update a mysql database previously created with [42api-aggregator](https://github.com/solareenlo/42api-aggregator) using [nodejs](https://nodejs.org/en/docs/) and [cron](https://fr.wikipedia.org/wiki/Cron)

## Getting started
### (node)
- Install [nodejs](https://nodejs.org/) and make sure `npm` is in your **PATH**

### (project & node_modules)
```shell
git clone https://github.com/solareenlo/42api-aggregator-cron.git
cd 42api-aggregator-cron
npm install
```

### (Environments variables)
In the project root $> `touch .env`

then in your file add the following keys
```gradle
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=myDB
FT_API_ENDPOINT=https://api.intra.42.fr
FT_API_UID=MY_APP_UID
FT_API_SECRET=MY_APP_SECRET
FT_API_RATE_LIMIT_PER_SECOND=1.8
FT_API_RATE_LIMIT_PER_HOUR=1200
```

### (Start)
```shell
npm run start
```

## License

[MIT](LICENSE.md)
