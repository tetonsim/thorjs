import {BoundaryCondition} from './boundaryCondition';
import {Load} from './load';

/**
 * A unique set of boundary conditions and loads that are applied to the model in unison.
 */
export interface Step {
  /**
   * A unique name for the step.
   */
  name: string;
  /**
   * A list of boundary conditions applied in this step.
   */
  boundary_conditions: Array<BoundaryCondition>
  /**
   * A list of loads applied in this step.
   */
  loads: Array<Load>;
}

export class Step {
  constructor(name?: string, boundary_condition?: BoundaryCondition[], loads?: Load[]) {
    this.name = name ?? 'step'
    this.boundary_conditions = boundary_condition ?? []
    this.loads = loads ?? []
  }
}
