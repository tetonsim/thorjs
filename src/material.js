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
 * @memberof Material
 * @property {string} name
 * @property {Material.Elastic} elastic
 */
class FEA {
  constructor(name, elastic) {
    this.name = name;
    this.elastic = elastic;
  }
}


/**
* Material supplier
* @typedef Supplier
* @memberof Material
* @property {string} id
* @property {string} name
*/

/**
* Material family definition (e.g. ABS, Polycarbonate, etc.)
* @typedef Family
* @memberof Material
* @property {string} id
* @property {string} name
* @property {string} abbreviation
*/

/**
 * @typedef Reinforcement
 * @memberof Material
 * @property {string} name
 * @property {number} weight_fraction
 * @property {number} L_over_D
 */

/**
* @typedef Property
* @memberof Material
* @property {string} name Display name
* @property {number} value
*/

/**
 * An engineering material definition
 * @memberof Material
 * @alias Material
 * @property {string} id
 * @property {string} name
 * @property {Material.Supplier} supplier
 * @property {Material.Family} family
 * @property {Reinforcement} reinforcement
 * @property {Object<string, Material.Property>} structural
 */
class _Material {
  /**
   * 
   * @param {string} name Name of material
   * @param {Material.Elastic} [elastic] Elastic properties
   */
  constructor(name, elastic = null) {
    this.id = null;
    this.name = name;
    this.family = null;
    this.vendor = null;
    this.properties = {};
  }

  /**
   * @returns {Material.Elastic}
   */
  get elastic() {
    let struc = this.properties.structural;
    let stiff = struc.stiffness;
    if (struc.isotropy == 'isotropic') {
      return Elastic.Isotropic(s.E.value, s.nu.value);
    } else if (struc.isotropy == 'transverse_isotropic') {
      // TODO
    } else if (struc.isotropy == 'orthotropic') {
      // TODO
    } else if (struc.isotropy == 'anisotropic') {
      // TODO
    }
    return null;
  }

  /**
   * @returns {Material.FEA}
   */
  get fea() {
    return new FEA(this.name, this.elastic);
  }
}

/**
 * Represents a composite material
 * @memberof Material
 */
class Composite {
  /**
   * 
   * @param {Material.FEA} matrix 
   * @param {Material.FEA} fiber 
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

/**
 * @namespace Material
 */
const Material = {
  Material: _Material,
  Elastic: Elastic,
  Composite: Composite,
  FEA: FEA
};

module.exports = Material;
