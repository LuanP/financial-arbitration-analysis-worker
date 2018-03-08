const R = require('ramda')
const config = require('config')
const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

let allModels = {}

const defaults = {
  logging: config.logging.level === 'debug' ? console.log : undefined,
  operatorsAliases: Sequelize.op,
  define: {
    underscored: true,
    timestamps: false,
    paranoid: false
  }
}

const Model = () => {}

Model.create = (db) => {
  const models = {}
  const sequelize = new Sequelize(db.name, db.username, db.password, R.merge(db.options, defaults))

  let resourcesPath = path.join(__dirname, '../schemas/exchanges')
  fs.readdirSync(resourcesPath).forEach((resourceName) => {
    if (resourceName !== db.exchangeName) {
      return
    }
    let specificResourcePath = path.join(resourcesPath, resourceName)
  
    fs.readdirSync(specificResourcePath).filter((file) => {
      return (file.indexOf('.schema') >= 0 && file.indexOf('.swp') < 0)
    }).forEach((file) => {
      var model = sequelize.import(file, require(path.join(specificResourcePath, file)))
      var modelsImported = R.type(model) === 'Array' ? model : [model]
  
      modelsImported.forEach((modelImported) => {
        models[modelImported.name] = modelImported
      })
    })
  })
  
  Object.keys(models).forEach((modelName) => {
    if ('associate' in models[modelName]) {
      models[modelName].associate(models)
    }
  })

  models.sequelize = sequelize
  models.Sequelize = sequelize

  return models
}

for (let i = 0; i < config.exchanges.length; i++) {
  const currentExchange = config.exchanges[i]
  allModels[currentExchange.exchangeName] = Model.create(currentExchange)
}

module.exports = allModels
