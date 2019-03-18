const FEA = require('./fea');
const Hardware = require('./hardware');
const Material = require('./material');
const Micro = require('./micro');
const API = require('./api');
const THREE = require('three');
const Canvas = require('./ui/canvas');

const UI = {
  THREE: THREE,
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
