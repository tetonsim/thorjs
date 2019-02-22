const FEA = require('./fea');
const Hardware = require('./hardware');
const Material = require('./material');
const Micro = require('./micro');
const API = require('./api');

const thor = {
  FEA: FEA,
  Material: Material,
  Micro: Micro,
  Hardware: Hardware,
  API: API
};

module.exports = thor;
