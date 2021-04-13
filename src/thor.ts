export {};

import { API } from './api';
import { chop, smartslice, fea, am } from './smartslice/job/job';

const thor = {
  API: API,
  chop: chop,
  smartslice: smartslice,
  fea: fea,
  am: am
};

module.exports = thor;
