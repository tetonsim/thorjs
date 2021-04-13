/**
 * FDM infill configuration.
 */
export interface Infill {
  /**
   * The name of the infill pattern. Valid values are "grid", "triangle", "triangles", and "cubic".
   */
  pattern: string;
  /**
   * The infill density (in percentage of volume). The density must be greater than or equal to 20 and less than
   * 95. Solid parts can be generated by increasing the number of bottom_layers/top_layers counts rather than setting
   * the infill density to 100.
   */
  density: number;
  /**
   * The angle of the infill pattern in degrees. 0 degrees is aligned with the print x-axis.
   */
  orientation: number;
}

export class Infill {
  constructor(pattern?: string, density?: number, orientation?: number) {
    this.pattern = pattern ?? 'grid';
    this.density = density ?? 20;
    this.orientation = orientation ?? 0.0;
  }
}
