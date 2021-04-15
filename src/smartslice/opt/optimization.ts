/**
 * SmartSlice optimization parameters.
 * Current column number [if this function was defined in a script]
 */
export interface Optimization {
  /**
   * The global minimum safety factor to target in the optimization. Print configurations that contain safety
   * factors lower than this number will be thrown out.
   */
  min_safety_factor: number;
  /**
   * The global maximum displacement magntiude (in millimeters) to target in the optimization. Print configurations
   * that contain displacements that exceed this number will be thrown out.
   */
  max_displacement: number;
}

export class Optimization {
  max_displacement: number;
  min_safety_factor: number;

  constructor(max_displacement?: number, min_safety_factor?: number) {
    this.max_displacement = max_displacement ? max_displacement : 1;
    this.min_safety_factor = min_safety_factor ? min_safety_factor : 2;
  }
}
