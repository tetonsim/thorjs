import { Config, DefaultPrintConfig } from "../../am/config";

/**
 * A surface mesh geometry defined using vertices and triangles.
 */
 export interface Mesh {
  /**
   * The type of mesh. Must be "normal" (a regular mesh that is part of printed geometry) or "infill" (a mesh that
   * overrides settings of normal meshes where they overlap, also referred to as a modifier mesh).
   */
  type: string;
  /**
   * A unique name for the mesh. This is used to refer to the mesh by other objects, such as boundary conditions and loads.
   */
  name: string;
  /**
   * A list of 3 float arrays that define the coordinates of the vertices.
   */
  vertices: Array<Array<number>>;
  /**
   * A list of 3 integer arrays that define the triangle connectivities. The integers refer to the indices of
   * the vertices (counting starts at zero). The computed triangle normal should point outward from the geometry
   * (consistent with the well known STL format)
   */
  triangles: Array<Array<number>>;
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

 export class DefaultMesh implements Mesh {
   type = 'normal';
   name = 'mesh';
   vertices = null;
   triangles = null;
   transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
   print_config = new DefaultPrintConfig();
 }