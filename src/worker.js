const R = require('ramda')
const config = require('config')
const moment = require('moment')
const math = require('./utils/math')
const logger = require('./utils/logging').logger
const Op = require('sequelize').Op
const sequelizeExchanges = require('./utils/sequelize-exchanges')
const Summary = require('./utils/sequelize-summaries').Summary

const exchangeNames = R.map((obj) => obj.exchangeName, config.exchanges)

const Worker = () => {}

Worker.amountPeriod = (obj) => {
  const data = R.split(':', obj)
  
  return {
    amount: data[0],
    period: data[1]
  }
}

Worker.getSummaryDataInterval = (obj) => {
  const splitIntervals = R.split(',', obj)

  return R.map((obj) => Worker.amountPeriod(obj), splitIntervals)
}

Worker.summarizeSpecificExchange = (data, exchangeName, interval) => {
  /*
   * fields in data:
   * baseAsset
   * quoteAsset
   * normalizedPair
   * denormalizedPair
   * price
   * createdAt
   * */
  let pairPrices = {}

  for (let i = 0; i < data.length; i++) {
    let currentData = data[i]

    if (pairPrices[currentData.normalizedPair] === undefined) {
      pairPrices[currentData.normalizedPair] = []
    }

    pairPrices[currentData.normalizedPair].push({
      price: Number.parseFloat(currentData.price).toFixed(8),
      createdAt: currentData.createdAt
    })
  }

  // pairPrices is now a dictionary that contains normalized pairs as keys
  // and prices of the provided interval as values in a list

  const summarizeExchangePair = (values, key) => {
    /*
     * values is a list of prices
     * key is a normalized pair
     * */

    let prices = R.map((obj) => obj.price, values)
    let createdAtList = R.map((obj) => obj.createdAt, values)
    let highestCreatedAt = math.highest(createdAtList)

    let lastPrice = R.find(R.propEq('createdAt', new Date(highestCreatedAt)))(values).price

    return {
      mean: math.mean(prices),
      median: math.median(prices),
      mode: math.mode(prices),
      lowest: math.lowest(prices),
      highest: math.highest(prices),
      last: lastPrice
    }
  }

  let summary = R.forEachObjIndexed(summarizeExchangePair, pairPrices)
  console.log('summary', JSON.stringify(summary))

  return summary
}

Worker.summarize = (exchangesData, interval) => {
  let summary = {}
  let exchangesSummaries = []

  for (let i = 0; i < exchangesData.length; i++) {
    let currentExchangeData = exchangesData[i]
    let currentExchangeName = R.keys(currentExchangeData)[0]

    exchangesSummaries.push(
      Worker.summarizeSpecificExchange(currentExchangeData[currentExchangeName], currentExchangeName, interval)
    )
  }


  // in each object of exchangesSummaries we will have
  // the key is a normalized pair and values:
  // mean
  // median
  // mode
  // lowest
  // highest
  // last
  for (let normalizedPair in exchangesSummaries) {
    let currentExchangeSummary = exchangesSummaries[normalizedPair]

    if (summary[normalizedPair] === undefined) {
      summary[normalizedPair] = {
        baseAsset: '',
        quoteAsset: '',
        dataInterval: '',
        trend: '',
        countPairInExchanges: 1,
        lastLowestPrice: '',
        lastHighestPrice: '',
        lastLowestPriceExchangeName: '',
        lastHighestPriceExchangeName: '',
        lastMeanPrice: '',
        lastMedianPrice: '',
        lastModePrice: '',
        lastPercentageLowestToHighestPrice: '',
        lastPercentageLowestToMedianPrice: ''
      }

      continue
    }

    summary[normalizedPair].countPairInExchanges++
    // add values
  }

  return summary
}

Worker.getData = (params) => {
  let promiseList = []

  for (let i = 0; i < exchangeNames.length; i++) {
    const currentExchange = exchangeNames[i]

    let ExchangeData = sequelizeExchanges[currentExchange].Data
    console.log(currentExchange)
    console.log(params)
    console.log(ExchangeData)

    promiseList.push(
      new Promise((resolve, reject) => {
        ExchangeData.findAll(params)
          .then((data) => {
            let response = {}

            response[currentExchange] = data
            return resolve(response)
          })
          .catch((err) => reject(err))
      })
    )
  }

  return Promise.all(promiseList)
}

Worker.getDataFromInterval = (interval) => {
  Worker.getData({
    where: {
      createdAt: {
        [Op.gte]: moment().subtract(interval.amount, interval.period).unix()
      }
    }
  })
  .then((exchangesData) => Worker.summarize(exchangesData, interval))
  .then((summarizedData) => Summary.create(summarizedData))
  .catch((err) => {
    logger.error(err)

    throw err
  })
}

Worker.call = async () => {
  let promiseList = []

  if (!config.summary || !config.summary.data || !config.summary.data.intervals) {
    throw new Error(
      'no interval provided. Provide a list of intervals separated by comma in the `SUMMARY_DATA_INTERVALS` variable'
    )
  }

  const summaryDataIntervals = Worker.getSummaryDataInterval(config.summary.data.intervals)

  for (let i = 0; i < summaryDataIntervals.length; i++) {
    let currentInterval = summaryDataIntervals[i]

    promiseList.push(
      new Promise((resolve, reject) => {
        Worker.getDataFromInterval(currentInterval)
      }).then(() => resolve())
      .catch((err) => {
        logger.error(err)

        return reject(err)
      })
    )
  }

  return Promise.all(promiseList)
}

Worker.start = () => {
  logger.info(`starting with ${config.running.mode} mode and interval set to ${config.interval}`)

  return new Promise((resolve, reject) => {
    if (config.running.mode === 'single-time' || config.interval === undefined) {
      Worker.call()
        .then(() => resolve())
        .catch((err) => {
          logger.error(err)
          return reject(err)
        })
      return
    }

    setInterval(Worker.call, config.interval)
    return resolve()
  })
}

module.exports = Worker
