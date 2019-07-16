/**
 * 3D printer configuration settings
 * @memberof Hardware
 */
class Config {
  constructor() {
    this.layer_width = 0.45;
    this.layer_height = 0.2;
    this.overlap = 0.0;
    this.walls = 2;
    this.bottom_layer = {
      layers: [
        {
          orientation: 45.0
        },
        {
          orientation: -45.0
        }
      ]
    };
    this.top_layer = {
      layers: [
        {
          orientation: 45.0
        },
        {
          orientation: -45.0
        }
      ]
    };
    this.infill = {
      pattern: 'grid',
      density: 50,
      orientation: 0.0
    };
  }

  /**
   * Calculates the default overlap for adjacent layers for the given layer height
   * @param {number} layer_height 
   */
  static defaultOverlap(layer_height) {
    return layer_height * (1.0 - Math.PI / 4.0);
  }
}

/**
 * @typedef MachineReference
 * @memberof Hardware
 * @property {string} id
 * @property {string} name
 */

/**
 * Additive manufacturing machine vendor
 * @typedef Vendor
 * @memberof Hardware
 * @property {string} id
 * @property {string} name
 * @property {Hardware.MachineReference[]} machines
 */

/**
 * @typedef MachineMaterial
 * @memberof Hardware
 * @type {Object}
 * @property {string} id
 * @property {string} name
 */

/**
 * Additive manufacturing machine
 * @memberof Hardware
 * @property {string} id Unique id
 * @property {string} name
 * @property {Vendor} vendor
 * @property {string} process The AM process this machine uses. Always FDM right now.
 * @property {Config} config The default print configuration for the machine
 * @property {Hardware.MachineMaterial[]} materials Valid materials for this machine
 */
class Machine {
  constructor(name) {
    this.id = null;
    this.name = name;
    this.vendor = null;
    this.process = null;
    this.config = new Config();
  }
}

/**
 * @namespace Hardware
 */
const Hardware = {
  Machine: Machine,
  Config: Config
}

module.exports = Hardware;
