const R = require('ramda')

module.exports = (sequelize, DataTypes) => {
  let Summary = sequelize.define('Summary',
    {
      id: {
        type: DataTypes.INTEGER(10).UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      baseAsset: {
        type: DataTypes.STRING(10),
        field: 'base_asset',
        allowNull: false
      },
      quoteAsset: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'quote_asset'
      },
      dataInterval: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'data_interval'
      },
      trend: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      countPairInExchanges: {
        type: DataTypes.TINYINT,
        allowNull: false,
        field: 'count_pair_in_exchanges'
      },
      createdAt: {
        type: 'TIMESTAMP',
        field: 'created_at',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      lastLowestPrice: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'last_lowest_price'
      },
      lastHighestPrice: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'last_highest_price'
      },
      lastLowestPriceExchangeName: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'last_lowest_price_exchange_name'
      },
      lastHighestPriceExchangeName: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'last_highest_price_exchange_name'
      },
      lastMeanPrice: {
        type: DataTypes.STRING(40),
        allowNull: false,
        field: 'last_mean_price'
      },
      lastMedianPrice: {
        type: DataTypes.STRING(40),
        allowNull: false,
        field: 'last_median_price'
      },
      lastModePrice: {
        type: DataTypes.STRING(40),
        allowNull: false,
        field: 'last_mode_price'
      },
      lastPercentageLowestToHighestPrice: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'last_percentage_lowest_to_highest_price'
      },
      lastPercentageLowestToMedianPrice: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'last_percentage_lowest_to_median_price'
      }
    }, { tableName: 'summaries' })

  Summary.prototype.toJSON = function () {
    return R.pickBy((data) => !R.isNil(data) && !R.isEmpty(data), this.dataValues)
  }

  return Summary
}
