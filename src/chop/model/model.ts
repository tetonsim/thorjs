import {Mesh} from '../mesh/mesh';
import {Slicer} from '../slicer/slicer';
import {Step} from './step';

/**
 * The process of "chopping" a model is to take the print configuration, including the model geometry and create
 * a finite element model. Therefore, this object defines the geometry, slicer settings, and boundary conditions
 * (such as fixed surfaces, applied loads, etc.).
 */
export interface Model {
  /**
   * A list of all of the surface mesh geometries. One printable mesh is required (and currently only one is
   * supported). Additional modifier meshes can also be specified in this list.
   */
  meshes: Array<Mesh>;
  /**
   * A list of the loading steps. Currently, only one step is supported.
   */
  steps: Step;
  /**
   * The slicing engine to use and all associated properties.
   */
  slicer: Slicer;
}


export class Model {
  meshes: Mesh[];
  slicer: Slicer;
  steps: Step;

  constructor(meshes?: Mesh[], slicer?: Slicer, steps?: Step) {
    this.meshes = meshes ? meshes : [];
    this.slicer = slicer ? slicer : new Slicer();
    this.steps = steps ? steps : new Step();
  }
}
