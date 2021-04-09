
import { Model } from "../../chop/model/model";
import { Material } from "../../fea/model/material";
import { Optimization } from "../opt/optimization";
import { Extruder } from "./extruder";


/**
 * A complete SmartSlice job definition (validation or optimization).
 */
 export interface Job {
  /**
   *  The job type. Acceptable values are "validation" and "optimization".
   */
  type: string;
 
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
  type: string;
  chop: Model;
  bulk: Material[];
  extruders: Extruder[];
  optimization: Optimization;

  constructor(type?: string , chop?: Model, bulk?: Material[], extruders?: Extruder[], optimization?: Optimization) {
    this.type = type ? type : 'validation'
    this.chop = chop ? chop : new Model()
    this.bulk = bulk ? bulk : [new Material]
    this.extruders = extruders ? extruders : [new Extruder()]
    this.optimization = optimization ? optimization : new Optimization()
  }

  toJSON(): string {
    const job = {
      type: this.type,
      chop: this.chop,
      extruders: this.extruders,
      optimization: this.optimization,
      bulk: this.bulk,
    }

    return JSON.stringify(job);
  }
}
