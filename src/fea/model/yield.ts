/**
 * Yield strength properties.
 *  This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
 export interface VonMisesYield {
  /**
   * type = "von_mises"
   */
  type: string;
  /**
   * Von Mises strength.
   */
  Sy: number;
 }

 /**
 * Yield strength properties.
 *  This object is polymorphic. The attributes depend on the value of the "type" attribute.
 */
export interface IsotropicYield {
  /**
   * type = "isotropic"
   */
  type: string;
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
  type = 'isotropic';
  T: number;
  C: number;
  S: number;
}

export class VonMisesYield {
  type = 'von_mises';
  Sy: number;
}

