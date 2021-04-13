export enum YieldType {
  vonMises = 'von_mises',
  isotropic = 'isotropic'
}

interface Yield {
  type: YieldType
}

/**
 * Yield strength properties.
 *  This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface VonMisesYield extends Yield {
  /**
   * Von Mises strength.
   */
  Sy: number;
}


/**
 * Yield strength properties.
 *  This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface IsotropicYield extends Yield {
  /**
   * Tensile strength.
   */
  T: number;
  /**
   * Compressive strength.
   */
  C: number;
  /**
   * Shear strength.
   */
  S: number;
}

export class IsotropicYield {
  type = YieldType.isotropic;

  constructor(T?: number, C?: number, S?: number) {
    this.T = T
    this.C = C
    this.S = S
  }
}

export class VonMisesYield {
  type = YieldType.vonMises;

  constructor(Sy?: number) {
    this.Sy = Sy
  }
}

