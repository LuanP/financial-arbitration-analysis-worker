const bunyan = require('bunyan')
const config = require('config')

const Logger = () => {}

Logger.logger = bunyan.createLogger({
  name: config.logging.project.name,
  streams: [
    {
      level: 'debug',
      stream: process.stdout
    }
  ],
  level: config.logging.level
})

module.exports = Logger
