/**
 * The results of the structural analysis (mechanical performance prediction).
 */
 export interface StructuralAnalysis {
    /**
     * The global minimum safety factor computed in the model.
     */
    min_safety_factor: number
    /**
     * The global maximum displacement magnitude computed in the model in millimeters.
     */
    max_displacement: number
}
