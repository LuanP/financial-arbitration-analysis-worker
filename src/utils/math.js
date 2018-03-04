const mathjs = require('mathjs')
const R = require('ramda')

const _Math = () => {}

_Math.mode = (values) => mathjs.mode(values)

_Math.mean = (values) => R.mean(values)

_Math.median = (values) => R.median(values)

_Math.lowest = (values) => Math.min(...values)

_Math.highest = (values) => Math.max(...values)

module.exports = _Math
