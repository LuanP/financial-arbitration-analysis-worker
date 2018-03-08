const R = require('ramda')

module.exports = (sequelize, DataTypes) => {
  let Data = sequelize.define('Data',
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
      normalizedPair: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'normalized_pair'
      },
      denormalizedPair: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'denormalized_pair'
      },
      price: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      createdAt: {
        type: 'TIMESTAMP',
        field: 'created_at',
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    }, { tableName: 'binance' })

  Data.prototype.toJSON = function () {
    return R.pickBy((data) => !R.isNil(data) && !R.isEmpty(data), this.dataValues)
  }

  return Data
}
