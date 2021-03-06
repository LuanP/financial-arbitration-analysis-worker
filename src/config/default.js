const path = require('path')
const env = process.env.NODE_ENV || 'development'
const root = path.join(__dirname, '..', '..')

try {
  require('dotenv').config({path: path.join(root, `.env-${env.toLowerCase()}`)})
} catch (err) {
  console.log(err)
}

const base = {
  summary: {
    data: {
      intervals: process.env.SUMMARY_DATA_INTERVALS || '10:minutes,30:minutes,1:hour,3:hours'
    }
  },
  exchange: {
    symbol: {
      delimiter: process.env.SYMBOL_DELIMITER || '-'
    }
  },
  interval: parseFloat(process.env.INTERVAL_IN_SECONDS || 300) * 1000,
  running: {
    mode: process.env.RUNNING_MODE || 'single-time'
  },
  db: {
    knex: {
      dialect: 'mysql2',
      tablename: 'knex_migrations'
    },
    name: process.env.DB_NAME || 'db',
    username: process.env.DB_USERNAME || 'worker',
    password: process.env.DB_PASSWORD || 'worker',
    options: {
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      debug: process.env.DB_DEBUG || false,
      logging: process.env.DB_LOGGING || undefined,
      pool: {
        max: process.env.DB_POOL_MAX || 20,
        min: process.env.DB_POOL_MIN || 5,
        idle: process.env.DB_POOL_IDLE || 10000
      }
    }
  },
  exchanges: [
    {
      exchangeName: 'binance',
      name: process.env.BINANCE_DB_NAME || 'db',
      username: process.env.BINANCE_DB_USERNAME || 'worker',
      password: process.env.BINANCE_DB_PASSWORD || 'worker',
      options: {
        dialect: 'mysql',
        host: process.env.BINANCE_DB_HOST || '0.0.0.0',
        port: process.env.BINANCE_DB_PORT || 3307,
        debug: process.env.BINANCE_DB_DEBUG || false,
        logging: process.env.BINANCE_DB_LOGGING || undefined,
        pool: {
          max: process.env.BINANCE_DB_POOL_MAX || 20,
          min: process.env.BINANCE_DB_POOL_MIN || 5,
          idle: process.env.BINANCE_DB_POOL_IDLE || 10000
        }
      }
    },
    {
      exchangeName: 'bittrex',
      name: process.env.BITTREX_DB_NAME || 'db',
      username: process.env.BITTREX_DB_USERNAME || 'worker',
      password: process.env.BITTREX_DB_PASSWORD || 'worker',
      options: {
        dialect: 'mysql',
        host: process.env.BITTREX_DB_HOST || '0.0.0.0',
        port: process.env.BITTREX_DB_PORT || 3308,
        debug: process.env.BITTREX_DB_DEBUG || false,
        logging: process.env.BITTREX_DB_LOGGING || undefined,
        pool: {
          max: process.env.BITTREX_DB_POOL_MAX || 20,
          min: process.env.BITTREX_DB_POOL_MIN || 5,
          idle: process.env.BITTREX_DB_POOL_IDLE || 10000
        }
      }
    }
  ],
  logging: {
    level: process.env.LOGGING_LEVEL || 'debug',
    project: {
      name: 'x-financial-arbitration-analysis-worker'
    }
  }
}

module.exports = base
