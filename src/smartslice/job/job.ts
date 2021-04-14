
import {Model} from '../../chop/model/model';
import {Material} from '../../fea/model/material';
import {Optimization} from '../opt/optimization';
import {Extruder} from './extruder';


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
