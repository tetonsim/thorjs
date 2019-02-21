/**
 * @namespace Material
 */

/**
 * Represents Elastic material behavior
 * @memberof Material
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
 * Material definition for FEA sim
 * @typedef FEA
 * @memberof Material
 * @property {string} name
 * @property {Material.Elastic} elastic
 */

/**
 * An engineering material definition
 * @memberof Material
 */
class Material {
  /**
   * 
   * @param {string} name Name of material
   * @param {Material.Elastic} [elastic] Elastic properties
   * @todo How to handle reported materials with reinforcements (not computed via micromechanics)
   */
  constructor(name, elastic = null) {
    this.id = null;
    this.name = name;
    this.properties = {
      elastic: elastic
    };
  }

  /**
   * @returns {Material.FEA}
   */
  get fea() {
    return {
      name: this.name,
      elastic: this.properties.elastic
    }
  }
}

/**
 * Represents a composite material
 * @memberof Material
 */
class Composite {
  /**
   * 
   * @param {Material.Material} matrix 
   * @param {Material.Material} fiber 
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
