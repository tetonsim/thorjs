/**
 *  Linear elastic material properties. All moduli should be given in units of MPa.
 *  This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
 export interface OrthotropicElastic {
  /**
   * type = "orthotropic"
   */
  type: string;
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
  type = 'orthotropic';
  E11: number;
  E22: number;
  E33: number;
  nu12: number;
  nu13: number;
  nu23: number;
  G12: number;
  G13: number;
  G23: number; 
 }

 /**
 * Linear elastic material properties. All moduli should be given in units of MPa.
 * This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface IsotropicElastic {
  /**
   * type = "isotropic"
   */
  type: string;
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
  type = 'isotropic';
  E: number;
  nu: number;
}

/**
 * Linear elastic material properties. All moduli should be given in units of MPa.
 * This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
 export interface TransverseIsotropicElastic {
  /**
   * type = "isotropic"
   */
  type: string;
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
  type = 'transverse_isotropic';
  iso_plane: number;
  Ea: number;
  Et: number;
  nuat: number;
  nutt: number;
 }
