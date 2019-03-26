const FEA = require('./fea');
const Hardware = require('./hardware');
const Material = require('./material');
const Micro = require('./micro');
const API = require('./api');

let THREE;
try {
  THREE = require('three');
} catch (err) {
  THREE = undefined;
}

const thor = {
  FEA: FEA,
  Material: Material,
  Micro: Micro,
  Hardware: Hardware,
  API: API,
  UI: null
};

if (typeof THREE !== 'undefined') {
  const Canvas = require('./ui/canvas');
  thor.UI = {
    Canvas: Canvas
  }
}

module.exports = thor;
