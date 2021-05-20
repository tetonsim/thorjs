
import {Config} from '../../am/config';
import {Extruder} from './extruder';
import {StructuralAnalysis} from './structuralAnalysis';
import {Mesh} from '../../chop/mesh/mesh';

/**
 * The results of analyzing a single print configuration.
 */
export interface Analysis {
    /**
     * The results of analyzing a single print configuration.
     */
    print_config: Config
    /**
     * integer, The estimated print time in seconds.
     */
    print_time: number
    /**
     * The material usage for all extruders.
     */
    extruders: Array<Extruder>
    /**
     * The structural analysis results.
     */
    structural: StructuralAnalysis
    /**
     * job was an optimization this contains the created modifier meshes (if any) for the analysis.
     */
    modifier_meshes: Array<Mesh>
}

