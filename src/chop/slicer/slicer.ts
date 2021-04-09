import { Config, DefaultPrintConfig } from "../../am/config";
import { DefaultPrinter, Printer } from "../machine/printer";

/**
 * A slicing engine and print settings.
 * The type attribute represents the slicing engine to use. Currently, the only, engine supported is "cura".
 */
 export interface Slicer {
  /**
   * type = "cura"
   */
  type: string;
  /**
   * The printer definition.
   */
  printer: Printer;
  /**
   * Global printer settings to be used by the slicer
   */
  print_config: Config;
 }

 export class DefaultSlicer implements Slicer {
  type = 'slicer'
  print_config: Config = new DefaultPrintConfig();
  printer: Printer = new DefaultPrinter()
}