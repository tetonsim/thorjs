
/**
 * 3D printer configuration settings
 */
class PrintConfig {
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

module.exports = { PrintConfig };
