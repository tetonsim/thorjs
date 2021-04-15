import {Fracture} from './fracture';
import {Elastic, FailureYield} from './types';

// type Elastic = LinearElastic.IsotropicElastic | LinearElastic.TransverseIsotropicElastic | LinearElastic.OrthotropicElastic;
// type FailureYield = Yield.IsotropicYield | Yield.VonMisesYield
/**
 * An engineering material definition.
 */
export interface Material {
  /**
   * A unique name for the material
   */
  name: string;
  /**
   * The material density in tonnes/mm^3
   */
  density: number;
  /**
   * The material's linear elastic properties
   */
  elastic: Elastic;
  /**
   * The material's yield strength properties
   */
  failure_yield: FailureYield;
  /**
   * The material's fracture properties
   */
  fracture: Fracture;
}

export class Material {
  constructor(
    name?: string,
    density?: number,
    elastic?: Elastic,
    failure_yield?: FailureYield,
    fracture?: Fracture,
  ) {
    this.name = name ?? '';
    this.density = density ?? 0;
    this.elastic = elastic ?? null;
    this.fracture = fracture ?? null;
    this.failure_yield = failure_yield ?? null;
  }
}


