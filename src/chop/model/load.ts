export type Int = number & { __int__: void };
 
/**
 * Defines a load upon a given portion of the model geometry.
 * The type attribute represents the type of load. The only, current, boundary condition type is "force".
 */
export interface Load {
  /**
   * type = "force"
   */
  type: string;
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
  face: Array<Int>;
  /**
   * The applied force vector in Newtons.
   */
  force: [number, number, number];
}

export class Load {
  type = 'force';
  name = 'load1';
  mesh = 'mesh';
  face = [0 as Int];
  force: [number, number, number] = [1, 0, 0];
}