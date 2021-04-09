/**
 * Establishes a relationship between an extruder on the printer and the bulk materials that can be used with the extruder.
 */
 export interface Extruder {
  /**
   * The extruder number (counting starts at zero)
   */
  number: number;
  /**
   * The names of the bulk materials that are usable in this extruder
   */
  usable_material: Array<string>;
 }

 export class Extruder {
  number: number;
  usable_material: Array<string>;

  constructor(number?: number, usable_material?: Array<string>) {
    this.number = number ? number : 0
    this.usable_material = usable_material ? usable_material : []
  }
}