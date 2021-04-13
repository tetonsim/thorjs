export enum BoundaryConditionType {
  fixed = 'fixed'
}

/**
 * Prescribes the displacement upon a given portion of the model geometry. Typically, this is used to fix a part of the
 * model (fix the displacement at zero).
 * This object is polymorphic. The attributes depend on the value of the "type" attribute.
 * The type attribute represents the type of boundary condition. The only, current, boundary condition type is "fixed".
 */
 export interface BoundaryCondition {
  /**
   * type = "fixed"
   */
  type: BoundaryConditionType;
  /**
   * A unique name for the boundary condition.
   */
  name: string;
  /**
   * The name of the chop.mesh.Mesh this boundary condition is applied to.
   */
  mesh: string;
  /**
   * A list of face ids on "mesh" that this boundary condition is applied to.
   */
  face: Array<number>;
}

export class BoundaryCondition {
  type = BoundaryConditionType.fixed;

  constructor(name?: string, mesh?: string, face?: number[]) {
    this.name = name ?? '';
    this.mesh = mesh ?? '';
    this.face = face ?? [];
  }
}

