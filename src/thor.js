const { Elastic, Material, Composite } = require('./material');
const { Builders } = require('./micro');
const { Config, Vendor, Machine } = require('./machine');
const API = require('./api');

module.exports = {
  Material: {
    Elastic: Elastic,
    Material: Material,
    Composite: Composite
  },
  Micro: {
    Builders: Builders
  },
  Machine: {
    Config,
    Vendor,
    Machine
  },
  API: API
}
