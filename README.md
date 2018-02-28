Exchange financial arbitration analysis worker
==============================================

The main idea of this project is to summarize data collected
from different exchanges adding information like trends (up, down, still)
and percentage comparison at the moment to othe exchanges in a generic way.

The data collected will be standardized in the following form:

* `base_asset`
* `quote_asset`
* `normalized_pair`
* `price`
* `created_at`

the indexes available in each database are:
* `created_at`
* `created_at` + `normalized_pair`

Each exchange will a have a different database.

The data will be analysed between the available exchanges and provide the following summarized output

* `base_asset` - it must be normalized
* `quote_asset` - it must be normalized
* `trend` - up / down / still
* `data_interval` - 10m / 30m / 1h / 3h
* `created_at`
* `highest_price_exchange_name`
* `lowest_price_exchange_name`
* `last_highest_price`
* `last_lowest_price`
* `last_mean_price`
* `last_median_price`
* `last_mode_price`
* `last_percentage_lowest_to_highest_price`
* `last_percentage_lowest_to_median_price`
