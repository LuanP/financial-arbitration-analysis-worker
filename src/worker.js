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

  let summary = {}

  const summarizeExchangePair = (values, key) => {
    /*
     * values is a list of prices
     * key is a normalized pair
     * */

    let prices = R.map((obj) => obj.price, values)
    let createdAtList = R.map((obj) => obj.createdAt, values)
    let highestCreatedAt = math.highest(createdAtList)

    let lastPrice = R.find(R.propEq('createdAt', new Date(highestCreatedAt)))(values).price

    summary[key] = {
      mean: math.mean(prices),
      median: math.median(prices),
      mode: math.mean(math.mode(prices)),
      lowest: math.lowest(prices),
      highest: math.highest(prices),
      last: lastPrice
    }
  }

  R.forEachObjIndexed(summarizeExchangePair, pairPrices)

  return summary
}

Worker.summarize = (exchangesData, interval) => {
  let summary = {}
  let exchangesSummaries = {}

  for (let i = 0; i < exchangesData.length; i++) {
    let currentExchangeData = exchangesData[i]
    let currentExchangeName = R.keys(currentExchangeData)[0]

    exchangesSummaries[currentExchangeName] = Worker.summarizeSpecificExchange(
      currentExchangeData[currentExchangeName],
      currentExchangeName,
      interval
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
  for (let currentExchangeName in exchangesSummaries) {
    let currentExchangeSummary = exchangesSummaries[currentExchangeName]

    for (let normalizedPair in currentExchangeSummary) {
      let currentPairSummary = currentExchangeSummary[normalizedPair]

      if (summary[normalizedPair] === undefined) {
        let assets = R.split('-', normalizedPair)

        summary[normalizedPair] = {
          baseAsset: assets[0],
          quoteAsset: assets[1],
          dataInterval: `${interval.amount}:${interval.period}`,
          trend: 'none',
          countPairInExchanges: 1,
          lastLowestPrice: currentPairSummary.last,
          lastHighestPrice: currentPairSummary.last,
          lastLowestPriceExchangeName: currentExchangeName,
          lastHighestPriceExchangeName: currentExchangeName,
          lastMeanPrice: [currentPairSummary.mean],
          lastMedianPrice: [currentPairSummary.median],
          lastModePrice: [currentPairSummary.mode],
          lastPercentageLowestToHighestPrice: 0,
          lastPercentageLowestToMedianPrice: 0
        }

        continue
      }

      let finalSummary = summary[normalizedPair]
      finalSummary.countPairInExchanges++
      finalSummary.lastMeanPrice.push(currentPairSummary.mean)
      finalSummary.lastMedianPrice.push(currentPairSummary.median)
      finalSummary.lastModePrice.push(currentPairSummary.mode)

      let updatePercentage = false
      if (finalSummary.lastLowestPrice > currentPairSummary.last) {
        updatePercentage = true
        finalSummary.lastLowestPrice = currentPairSummary.last
        finalSummary.lastLowestPriceExchangeName = currentExchangeName

      }

      if (finalSummary.lastHighestPrice < currentPairSummary.last) {
        updatePercentage = true
        finalSummary.lastHighestPrice = currentPairSummary.last
        finalSummary.lastHighestPriceExchangeName = currentExchangeName
      }

      if (updatePercentage === false) {
        continue
      }

      // percentage -> ((xf - xi) / xi) * 100
      finalSummary.lastPercentageLowestToHighestPrice = (
        (finalSummary.lastHighestPrice - finalSummary.lastLowestPrice) / finalSummary.lastLowestPrice
      ) * 100
    }
  }

  for (let normalizedPair in summary) {
    let currentSummary = summary[normalizedPair]
    currentSummary['lastMeanPrice'] = math.mean(currentSummary['lastMeanPrice'])
    currentSummary['lastMedianPrice'] = math.median(currentSummary['lastMedianPrice'])
    currentSummary['lastModePrice'] = math.median(math.mode(currentSummary['lastModePrice']))

    currentSummary.lastPercentageLowestToMedianPrice = (
      (currentSummary.lastMedianPrice - currentSummary.lastLowestPrice) / currentSummary.lastLowestPrice
    ) * 100
  }

  return summary
}

Worker.saveSummaries = (summarizedData) => {
  let promiseList = []
  for (let normalizedPair in summarizedData) {
    let currentSummary = summarizedData[normalizedPair]

    currentSummary.lastLowestPrice = currentSummary.lastLowestPrice.toString()
    currentSummary.lastHighestPrice = currentSummary.lastHighestPrice.toString()
    currentSummary.lastMeanPrice = currentSummary.lastMeanPrice.toString()
    currentSummary.lastMedianPrice = currentSummary.lastMedianPrice.toString()
    currentSummary.lastModePrice = currentSummary.lastModePrice.toString()
    currentSummary.lastPercentageLowestToHighestPrice = currentSummary.lastPercentageLowestToHighestPrice.toString()
    currentSummary.lastPercentageLowestToMedianPrice = currentSummary.lastPercentageLowestToMedianPrice.toString()

    promiseList.push(Summary.create(currentSummary))
  }

  return promiseList
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
  .then((summarizedData) => Worker.saveSummaries(summarizedData))
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
