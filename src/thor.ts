export {};

const API = require('./api')
import * as JobDefinitions from './job'

const thor = {
  API: API,
  JobDefinitions: JobDefinitions
};

module.exports = thor;
