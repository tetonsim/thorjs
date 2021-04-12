
import {Infill} from './infill';

/**
 * An FDM printer configuration definition. This can be used to apply settings globally,
 * for a specific extruder, or for a specific mesh.
 */
export interface Config {
  /**
   * The width of a printed road/extrusion in millimeters. This should be greater than or equal to the extruder's diameter.
   */
  layer_width: number;
  /**
   * The height of a printer road/extrusion/layer in millimeters. This should be less than or equal to the extruder's diameter.
   */
  layer_height: number;
  /**
   * The number of walls printed around the perimeter of a layer.
   */
  walls: number;
  /**
   * The number of bottom layers to print.
   */
  bottom_layers: number;
  /**
   * The number of top layers to print.
   * Current column number [if this function was defined in a script]
   */
  top_layers: number;
  /**
   * A list of the orientations (in degrees) that skins/layers are printed at. It is assumed the slicer
   * will start at the beginning of the list at layer 1 and iterate through the list, changing the orientation
   * of any skin/layer regions in the layer. When the end of the list is reached it starts back at the beginning.
   * For example a value of [45, 135] would alternate between 45 and 135 degree skins. 0 degree angles are parallel
   * to the print x-axis. All orientations should be 0 <= angle < 360.
   */
  skin_orientations: Array<number>;
  /**
   * Infill properties.
   */
  infill: Infill;
  /**
   * All auxiliary properties that will be passed on to the slicer. These properties may or may not affect the
   * mechanical performance of the final printed part, but generally, they are not of interest in the context of
   * SmartSlice, so they do not have specifically defined attributes in the am.Config object. SmartSlice will
   * populate this dictionary with the slicer's default properties and then override any that are defined explicitly here.
   */
  auxiliary: Record<string, unknown>;
}


export class Config {
  layer_height = .2
  layer_width = .45
  bottom_layers = 6
  top_layers = 6
  infill: Infill = {
    pattern: 'grid',
    density: 20,
    orientation: 0.0,
  }
  walls = 2
  skin_orientations = [45, 135]
}
