import * as LinearElastic from './elastic';
import * as Yield from './yield';

export type Elastic = LinearElastic.IsotropicElastic | LinearElastic.TransverseIsotropicElastic | LinearElastic.OrthotropicElastic;
export type FailureYield = Yield.IsotropicYield | Yield.VonMisesYield