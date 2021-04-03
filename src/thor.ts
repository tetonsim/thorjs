export {};

// const API = require('./api');
import {API} from './api'
import {job} from './job'

const thor = {
  API: API,
  Job: job,
};

module.exports = thor;
