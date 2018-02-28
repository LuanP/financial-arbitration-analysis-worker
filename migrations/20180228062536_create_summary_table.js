exports.up = (knex, Promise) => {
  return knex.schema.createTable('summaries', (table) => {
    table.increments('id').unsigned().notNullable().primary()

    table.string('base_asset', 10).notNullable()
    table.string('quote_asset', 10).notNullable()
    table.string('data_interval', 10).notNullable()
    table.string('trend', 10).notNullable()  // up, down still (based on data interval)

    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.string('last_lowest_price', 20).notNullable()
    table.string('last_highest_price', 20).notNullable()
    table.string('last_lowest_price_exchange_name', 20).notNullable()
    table.string('last_highest_price_exchange_name', 20).notNullable()

    table.string('last_mean_price', 20).notNullable()
    table.string('last_median_price', 20).notNullable()
    table.string('last_mode_price', 20).notNullable()

    table.string('last_percentage_lowest_to_highest_price', 20).notNullable()
    table.string('last_percentage_lowest_to_median_price', 20).notNullable()

    table.index('created_at', 'index_created_at')
    table.index(['created_at', 'base_asset'], 'index_created_at_base_asset')
    table.index(['created_at', 'quote_asset'], 'index_created_at_quote_asset')
    table.index(['created_at', 'base_asset', 'quote_asset'], 'index_created_at_base_asset_quote_asset')

    table.comment(`summaries of data collected from different exchanges`)
    table.engine('InnoDB')
  })
}

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('summaries')
}
