import {Config} from '../../am/config';
import {Printer} from '../machine/printer';


export enum SlicerType {
  cura = 'cura'
}

/**
 * A slicing engine and print settings.
 * The type attribute represents the slicing engine to use. Currently, the only, engine supported is "cura".
 */
export interface Slicer {
  /**
   * type = "cura"
   */
  type: SlicerType;
  /**
   * The printer definition.
   */
  printer: Printer;
  /**
   * Global printer settings to be used by the slicer
   */
  print_config: Config;
}

export class Slicer {
  type = SlicerType.cura;

  constructor(print_config?: Config, printer?: Printer) {
    this.print_config = print_config ?? new Config();
    this.printer = printer ?? new Printer();
  }
}
