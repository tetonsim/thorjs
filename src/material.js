
/**
 * Represents Elastic material behavior
 */
class Elastic {
  constructor() {
    this.type = null;
  }

  static Isotropic(E, nu) {
    var elas = new Elastic();
    elas.type = 'isotropic';
    Object.assign(elas,
      {
        E: E,
        nu: nu
      }
    );
    return elas;
  }
}

/**
 * An engineering material definition
 */
class Material {
  /**
   * 
   * @param {string} name Name of material
   * @param {Elastic} [elastic] Elastic properties
   */
  constructor(name, elastic = null) {
    this.name = name;
    this.elastic = elastic;
  }
}

/**
 * Represents a composite material
 */
class Composite {
  /**
   * 
   * @param {Material} matrix 
   * @param {Material} fiber 
   * @param {number} volume_fraction 
   * @param {number} [L_over_D]
   */
  constructor(matrix, fiber, volume_fraction, L_over_D) {
    this.matrix = matrix;
    this.fiber = fiber;
    this.volume_fraction = volume_fraction;
    this.L_over_D = L_over_D
  }
}

module.exports = { Elastic, Material, Composite };
