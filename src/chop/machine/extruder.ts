
 import {Config} from '../../am/config';

 /**
 * Establishes a relationship between an extruder on the printer and the bulk materials that can be used with the extruder.
 */
export interface Extruder {
  /**
   * The extruder number (counting starts at zero)
   */
  id: number;
  /**
   * The names of the bulk materials that are usable in this extruder
   */
  diameter: number;
  /**
   * Current column number [if this function was defined in a script]
   */
  print_config: Config;
}

export class Extruder {
  constructor(id?: number, diameter?: number, print_config?:Config) {
    this.id = id;
    this.diameter = diameter;
    this.print_config = print_config;
  }
}
