import * as Elastic from './elastic'
import * as Yield from './yield'
import {Fracture} from './fracture'


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
  elastic: Elastic.IsotropicElastic | Elastic.TransverseIsotropicElastic | Elastic.OrthotropicElastic;
  /**
   * The material's yield strength properties
   */
  failure_yield: Yield.VonMisesYield | Yield.IsotropicYield;
  /**
   * The material's fracture properties
   */
  fracture: Fracture;
}

export class Material {
  density: number;
  elastic: Elastic.IsotropicElastic | Elastic.TransverseIsotropicElastic | Elastic.OrthotropicElastic;
  failure_yield: Yield.VonMisesYield | Yield.IsotropicYield;
  fracture: Fracture;
  name: string;

  constructor(
    density?: number,
    elastic?: Elastic.IsotropicElastic | Elastic.TransverseIsotropicElastic | Elastic.OrthotropicElastic,
    failure_yield?: Yield.VonMisesYield | Yield.IsotropicYield,
    fracture?: Fracture,
    name?: string
  ) {
    this.density = density ? density : 0
    this.elastic = elastic ? elastic : null
    this.fracture = fracture ? fracture : null
    this.failure_yield = failure_yield ? failure_yield : null 
    this.name = name ? name : 'default'
  }
}