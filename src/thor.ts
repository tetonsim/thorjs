export {};

import {API} from './api';
import {Job} from './smartslice/job/job';

const thor = {
  API: API,
  Job: Job,
};

module.exports = thor;
