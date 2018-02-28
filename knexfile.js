const db = require('config').db

const dbConfig = {
  client: db.knex.dialect,
  connection: {
    host: db.options.host,
    port: db.options.port,
    database: db.name,
    user: db.username,
    password: db.password
  },
  pool: {
    min: db.options.pool.min,
    max: db.options.pool.max
  },
  migrations: {
    tableName: db.knex.tablename
  }
}

module.exports = {
  test: dbConfig,
  development: dbConfig,
  stage: dbConfig,
  pilot: dbConfig,
  production: dbConfig
}
