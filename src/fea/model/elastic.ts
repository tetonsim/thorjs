interface Elastic {
  /**
   * type = 'orthotropic' | 'isotropic' | 'transverse_isotropic'
   */
  type: ElasticType
}

export enum ElasticType {
  orthotropic = 'orthotropic',
  isotropic = 'isotropic',
  transverse_isotropic = 'transverse_isotropic',
}

/**
 *  Linear elastic material properties. All moduli should be given in units of MPa.
 *  This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface OrthotropicElastic extends Elastic {
  /**
   * Elastic modulus parallel to material 1 axis
   */
  E11: number;
  /**
   * Elastic modulus parallel to material 2 axis
   */
  E22: number;
  /**
   * Elastic modulus parallel to material 3 axis
   */
  E33: number;
  /**
   * Poisson ratio between material 1 and 2 axes
   */
  nu12: number;
  /**
   * Poisson ratio between material 1 and 3 axes
   */
  nu13: number;
  /**
   * Poisson ratio between material 2 and 3 axes
   */
  nu23: number;
  /**
   * hear modulus in 12 plane
   */
  G12: number;
  /**
   * hear modulus in 13 plane
   */
  G13: number;
  /**
   * hear modulus in 23 plane
   */
  G23: number;
}

export class OrthotropicElastic {
  type = ElasticType.orthotropic;

  constructor(
    E11?: number, E22?: number, E33?: number,
    nu12?: number, nu13?: number, nu23?: number,
    G12?: number, G13?: number, G23?: number,
  ) {
    this.E11 = E11;
    this.E22 = E22;
    this.E33 = E33;
    this.nu12 = nu12;
    this.nu13 = nu13;
    this.nu23 = nu23;
    this.G12 = G12;
    this.G13 = G13;
    this.G23 = G23;
  }
}

 /**
 * Linear elastic material properties. All moduli should be given in units of MPa.
 * This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface IsotropicElastic extends Elastic{
  /**
   * Elastic modulus
   */
  E: number;
  /**
   * Poisson ratio
   */
  nu: number;
}

export class IsotropicElastic {
  type = ElasticType.isotropic;

  constructor(E?: number, nu?: number) {
    this.E = E;
    this.nu = nu;
  }
}

/**
 * Linear elastic material properties. All moduli should be given in units of MPa.
 * This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface TransverseIsotropicElastic extends Elastic {
  /**
   *  The plane of isotropy, must be one of 12, 13, or 23
   */
  iso_plane: number;
  /**
   * Elastic modulus perpendicular to plane of isotropy
   */
  Ea: number;
  /**
   * Elastic modulus in plane of isotropy
   */
  Et: number;
  /**
   * Poisson ratio between axis perpendicular to plane of isotropy and an axis in the plane of isotropy. For example, if iso_plane=23, nuat would represent nu12 and nu13.
   */
  nuat: number;
  /**
   * Poisson ratio in plane of isotropy. For example, if iso_plane=23, nutt would represent nu23.
   */
  nutt: number;
}

export class TransverseIsotropicElastic {
  type = ElasticType.transverse_isotropic;

  constructor(iso_plane?: number, Ea?: number, Et?: number, nuat?: number, nutt?: number) {
    this.iso_plane = iso_plane;
    this.Ea = Ea;
    this.Et = Et;
    this.nuat = nuat;
    this.nutt = nutt;
  }
}
