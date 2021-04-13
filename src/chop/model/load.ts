export enum LoadType {
  force = 'force'
}

type Vector = [number, number, number]
//  type VectorArray ={ }
/**
 * Defines a load upon a given portion of the model geometry.
 * The type attribute represents the type of load. The only, current, boundary condition type is "force".
 */
export interface Load {
  /**
   * type = "force"
   */
  type: LoadType;
  /**
   * A unique name for the load.
   */
  name: string;
  /**
   * The name of the chop.mesh.Mesh this load is applied to
   */
  mesh: string;
  /**
   * A list of face ids on "mesh" that this load is applied to.
   */
  face: Array<number>;
  /**
   * The applied force vector in Newtons.
   */
  force: Vector;
}

export class Load {
  type = LoadType.force;

  constructor(name?: string, mesh?: string, face?: number[], force?: Vector) {
    this.name = name ?? '';
    this.mesh = mesh ?? '';
    this.face = face ?? null;
    this.force = force ?? null;
  }
}
