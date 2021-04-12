import { Config } from '../../am/config'
import { Extruder } from './extruder'

/**
 * An FDM printer definition.
 */
export interface Printer {
  /**
   * A name for the printer. This currently is not used or referenced in any logic.
   */
  name: string;
  /**
   * list of the extruders on the printer
   */
  extruders: Array<Extruder>;
 }

export class Printer {
  name = 'printer'
  extruders: Extruder[] = [{
    id: 0,
    diameter: .4,
    print_config: new Config()
  }]
}