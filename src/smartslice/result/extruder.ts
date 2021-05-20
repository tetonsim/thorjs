/**
 * The material usage prediction for an extruder used in an analysis.
 */
 export interface Extruder {
    /**
     * The extruder number.
     */
    number: number
    /**
     * The name of the bulk material used in this extruder.
     */
    material: string
    /**
     * The predicted material usage in units of cubic millimeters.
     */
    material_volume: number
}
