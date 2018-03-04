const R = require('ramda')
const axios = require('axios')
const config = require('config')
const normalize = require('x-cryptocurrencies-normalizr')
const math = require('./utils/math')
const logger = require('./utils/logging').logger
const Op = require('sequelize').Op
const sequelizeExchanges = require('./utils/sequelize-exchanges')
const Summary = require('./utils/sequelize-summaries').Summary

const exchangeNames = R.map((obj) => obj.exchangeName, config.exchanges)

const Worker = () => {}

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

  const summarizeSpecificExchange = (values, key) => {
    /*
     * values is a list of prices
     * key is a normalized pair
     * */

    let prices = R.map((obj) => obj.price, values)
    let createdAtList = R.map((obj) => obj.createdAt, values)
    let highestCreatedAt = math.highest(createdAtList)

    let lastPrice = R.find(R.propEq('createdAt', highestCreatedAt))(values).price

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

  return summary
}

Worker.summarize = (exchangesData, interval) => {
  let summary = {}
  let exchangesSummaries = []

  for (let i = 0; i < exchangesData.length; i++) {
    let currentExchangeData = exchangesData[i]
    let currentExchangeName = R.keys(currentExchangeData)[0]

    exchangeSummaries.push(
      Worker.summarizeSpecificExchange(currentExchangeData[currentExchangeName], exchangeName, interval)
    )
  }

  // in each object of exchangeSummaries we will have
  // the key is a normalized pair and values:
  // mean
  // median
  // mode
  // lowest
  // highest
  // last
  for (let normalizedPair in exchangeSummaries) {
    let currentExchangeSummary = exchangeSummaries[normalizedPair]

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

  return promiseList
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
  let promisesList = []
  for (let i = 0; i < config.data.intervals.length; i++) {
    let currentInterval = config.data.intervals[i]

    promisesList.push(
      new Promise((resolve, reject) => {
        Worker.getDataFromInterval(currentInterval)
      }).then(() => resolve())
      .catch((err) => {
        logger.error(err)

        return reject(err)
      })
    )
  }

  return promisesList
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
