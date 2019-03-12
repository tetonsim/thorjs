const FEA = require('./fea');
const Hardware = require('./hardware');
const Material = require('./material');
const Micro = require('./micro');
const API = require('./api');
const Canvas = require('./ui/canvas');

const UI = {
  Canvas: Canvas
};

const thor = {
  FEA: FEA,
  Material: Material,
  Micro: Micro,
  Hardware: Hardware,
  API: API,
  UI: UI
};

module.exports = thor;
