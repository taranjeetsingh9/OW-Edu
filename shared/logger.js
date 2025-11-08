const pino = require('pino');
const config = require('../config');
const level = (config && config.LOG_LEVEL) ? config.LOG_LEVEL : 'info';
module.exports = pino({ level });
