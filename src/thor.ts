export { };

import {Config} from './am/config';
import {Infill} from './am/infill';
import {API} from './api';
import {Printer} from './chop/machine/printer';
import {Mesh} from './chop/mesh/mesh';
import {BoundaryCondition} from './chop/model/boundaryCondition';
import {Load} from './chop/model/load';
import {Model} from './chop/model/model';
import {Step} from './chop/model/step';
import {Slicer} from './chop/slicer/slicer';
import {IsotropicElastic, OrthotropicElastic, TransverseIsotropicElastic} from './fea/model/elastic';
import {Fracture} from './fea/model/fracture';
import {Material} from './fea/model/material';
import {IsotropicYield, VonMisesYield} from './fea/model/yield';
import {Extruder} from './smartslice/job/extruder';
import {JobType, Job} from './smartslice/job/job';
import {Optimization} from './smartslice/opt/optimization';


const smartslice = {
  job: {
    Job: Job,
    JobType: JobType,
    Extruder: Extruder,
  },
  opt: {
    Optimization: Optimization,
  },
};

const fea = {
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

const chop = {
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

const am = {
  Config: Config,
  Infill: Infill,
};

export const thor = {
  API: API,
  chop: chop,
  smartslice: smartslice,
  fea: fea,
  am: am,
};
