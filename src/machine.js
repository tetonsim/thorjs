
/**
 * 3D printer configuration settings
 */
class Config {
  constructor() {
    this.layer_width = 0.45;
    this.layer_height = 0.2;
    this.overlap = 0.0;
    this.infill_type = 'grid';
    this.infill_volume_fraction = 20;
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
 * Additive manufacturing machine vendor
 * @property {string} id Unique id
 * @property {string} name
 */
class Vendor {
  constructor(name) {
    this.id = null;
    this.name = name;
  }
}

/**
 * Additive manufacturing machine
 * @property {string} id Unique id
 * @property {string} name
 * @property {Vendor} vendor
 * @property {string} process The AM process this machine uses. Always FDM right now.
 * @property {Config} config The default print configuration for the machine
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

module.exports = { Config, Vendor, Machine };
