
import {Mesh} from '../../chop/mesh/mesh';
import {BoundaryCondition} from '../../chop/model/boundaryCondition';
import {Load} from '../../chop/model/load';
import {Model} from '../../chop/model/model';
import {Step} from '../../chop/model/step';
import {IsotropicElastic, OrthotropicElastic, TransverseIsotropicElastic} from '../../fea/model/elastic';
import {Material} from '../../fea/model/material';
import {IsotropicYield, VonMisesYield} from '../../fea/model/yield';
import {Optimization} from '../opt/optimization';
import {Extruder} from './extruder';
import {Fracture} from '../../fea/model/fracture';
import {Slicer} from '../../chop/slicer/slicer';
import {Printer} from '../../chop/machine/printer';
import {Config} from '../../am/config';
import {Infill} from '../../am/infill';


export enum JobType {
  validation = 'validation',
  optimization = 'optimization',
}

/**
 * A complete SmartSlice job definition (validation or optimization).
 */
export interface Job {
  /**
   *  The job type. Acceptable values are "validation" and "optimization".
   */
  type: JobType;

  chop: Model;
  /**
   * List of bulk materials used in print. Currently multiple materials is not supported.
   */
  bulk: Array<Material>;
  /**
   * todo add definition
   */
  extruders: Array<Extruder>;
  /**
   * Optimization configuration if the job type is "optimization". If "validation" this can be omitted.
   */
  optimization: Optimization;
}


export class Job {
  constructor(type?: JobType, chop?: Model, bulk?: Material[], extruders?: Extruder[], optimization?: Optimization) {
    this.type = type ?? JobType.validation;
    this.chop = chop ?? new Model();
    this.bulk = bulk ?? [new Material];
    this.extruders = extruders ?? [new Extruder()];
    this.optimization = optimization ?? new Optimization();
  }
}

export const smartslice = {
  job: {
    Job: Job,
    JobType: JobType,
    Extruder: Extruder,
  },
  opt: {
    Optimization: Optimization,
  },
};

export const fea = {
  model: {
    Material: Material,
    Elastic: {
      Isotropic: IsotropicElastic,
      Transverse: TransverseIsotropicElastic,
      Orthotropic: OrthotropicElastic,
    },
    Yield: {
      VonMises: VonMisesYield,
      Isotropic: IsotropicYield,
    },
    Fracture: Fracture,
  },
};

export const chop = {
  model: {
    Model: Model,
    Step: Step,
    BoundaryCondition: BoundaryCondition,
    Load: Load,
  },
  mesh: {
    Mesh: Mesh,
  },
  slicer: {
    Slicer: Slicer,
  },
  machine: {
    Printer: Printer,
  },
};

export const am = {
  Config: Config,
  Infill: Infill,
};
