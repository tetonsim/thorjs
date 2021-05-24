import {Database} from '../../fea/result/database';
import {Analysis} from './analysis';


/**
 * The complete result definition from a completed SmartSlice job.
 * This object may contain results from multiple analyses/simulations
 * that make up a single job.
 */
export interface Result{
  /**
   * The status of the result if the job type is optimization. Will be one of "solution_found" or "no_solution_found".
   */
  status: string
  /**
   * If the job type is optimization SmartSlice first runs an analysis of a solid model
   * to determine if the desired requirements are feasible for even a very stiff
   * and strong configuration. This attribute represents the status of that analysis.
   * It will be one of "feasible" or "infeasible".
   * This attribute is not applicable to validation jobs.
   */
  feasibility_status: string
  /**
   * See "feasibility_status" for a description of the feasibility analysis.
   * This object contains the results of that analysis.
   */
  feasibility_result: Analysis
  /**
   * A list of analysis results. If the job is a validation only one item
   * will be in this array, otherwise, for optimizations, there may be multiple analyses that represent multiple solutions.
   * If the status is "no_solution_found" then this array will be empty.
   */
  analyses: Array<Analysis>
  /**
   * Simulation results associated with the FEA model. For a validation this object contains the results of the job.
   * For an optimization this will contain the results of the feasibility model,
   * if and only if, the feasibility_status is "infeasible".
   */
  fea_results: Database
  /**
   * Simulation results mapped back to the original surface mesh geometry. For a validation
   * this object contains the surface mesh mapped results of the job. For an optimization this
   * will contain the results of the feasibility model, if and only if, the feasibility_status is "infeasible".
   */
  surface_mesh_results: Database
}
