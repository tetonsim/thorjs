import { Config } from '../../am/config';

export enum MeshType {
  normal = 'normal',
  infill = 'infill'
}

type VectorArray = Array<[number, number, number]>
/**
 * A surface mesh geometry defined using vertices and triangles.
 */
export interface Mesh {
  /**
   * The type of mesh. Must be "normal" (a regular mesh that is part of printed geometry) or "infill" (a mesh that
   * overrides settings of normal meshes where they overlap, also referred to as a modifier mesh).
   */
  type: MeshType;
  /**
   * A unique name for the mesh. This is used to refer to the mesh by other objects, such as boundary conditions and loads.
   */
  name: string;
  /**
   * A list of 3 float arrays that define the coordinates of the vertices.
   */
  vertices: VectorArray;
  /**
   * A list of 3 integer arrays that define the triangle connectivities. The integers refer to the indices of
   * the vertices (counting starts at zero). The computed triangle normal should point outward from the geometry
   * (consistent with the well known STL format)
   */
  triangles: VectorArray;
  /**
   * An array of 16 floats that represent the transformation matrix in flattened form in row major order.
   * The default is the identity matrix.
   */
  transform: Array<number>;
  /**
   * Print settings unique to this mesh.
   */
  print_config: Config;
 }

export class Mesh {
  constructor(
    name?: string,
    transform?: number[],
    print_config?: Config,
    vertices?: VectorArray,
    triangles?: VectorArray
  ) {
    this.name = name ?? 'mesh'
    this.transform = transform ?? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    this.print_config = print_config ?? new Config()
    this.vertices = vertices ?? []
    this.triangles = triangles ?? []
  }
}
