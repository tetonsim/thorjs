const THREE = require('three');
const Mesh = require('./mesh');

class Model {
  /**
   * 
   * @param {FEA.Model} model FEA model definition
   */
  constructor(model) {
    Object.assign(this, model);
    this.edges = new MeshEdges(this.mesh);
  }

  /**
   * Creates and returns an undeformed Geometry of the model mesh
   * @returns {THREE.Geometry}
   */
  meshGeometry(initVertexColor=null) {
    let geom = new THREE.Geometry();

    geom.nodeMap = new Map();

    for (let node of this.mesh.nodes) {
      let pos = new THREE.Vector3(node[1], node[2], node[3]);

      geom.vertices.push(pos);
    }

    for (let egroup of this.mesh.elements) {
      let faceIndices = null;

      if (egroup.type === 'HEXL8') {
        faceIndices = Mesh.HEXL8.FACE_INDICES;
      } else if (egroup.type === 'WEDL6') {
        faceIndices = Mesh.WEDL6.FACE_INDICES;
      } else if (egroup.type === 'TETL4') {
        faceIndices = Mesh.TETL4.FACE_INDICES;
      } else {
        throw 'Unsupported element type ' + egroup.type;
      }

      if (faceIndices !== null) {
        for (let conn of egroup.connectivity) {
          for (let ijk of faceIndices) {
            let face = new THREE.Face3(conn[ijk[0]] - 1, conn[ijk[1]] - 1, conn[ijk[2]] - 1);
            if (initVertexColor !== null) {
              face.vertexColors = [
                new THREE.Color(initVertexColor),
                new THREE.Color(initVertexColor),
                new THREE.Color(initVertexColor)
              ];
            }
            geom.faces.push(face);

            for (let faceVertexIndex in ijk) {
              let globalNodeId = conn[ijk[faceVertexIndex]];

              let nmap = geom.nodeMap.get(globalNodeId);
        
              if (nmap === undefined) {
                nmap = new NodeTracker();
                geom.nodeMap.set(globalNodeId, nmap);
              }

              nmap.addFace(geom.faces.length - 1, faceVertexIndex);
            }
          }
        }
      }
    }

    geom.computeFaceNormals();
    //geom.computeVertexNormals();
    geom.computeBoundingBox();

    return geom;
  }

  wireframeGeometry(maxShare = 2) {
    let lgeom = new THREE.Geometry();

    lgeom.nodeMap = new Map();

    for (let [key, edge] of this.edges.edges) {
      if (edge.count > maxShare) {
        continue;
      }

      let n1 = this.mesh.nodes[edge.n1];
      let n2 = this.mesh.nodes[edge.n2];
      
      let v1 = new THREE.Vector3(n1[1], n1[2], n1[3]);
      let v2 = new THREE.Vector3(n2[1], n2[2], n2[3]);

      lgeom.vertices.push(v1, v2);

      let n1map = lgeom.nodeMap.get(n1[0]);
      let n2map = lgeom.nodeMap.get(n2[0]);

      if (n1map === undefined) {
        n1map = new NodeTracker();
        lgeom.nodeMap.set(n1[0], n1map);
      }

      if (n2map === undefined) {
        n2map = new NodeTracker();
        lgeom.nodeMap.set(n2[0], n2map);
      }

      n1map.addVertex(lgeom.vertices.length  - 2);
      n2map.addVertex(lgeom.vertices.length  - 1);
    }

    return lgeom;
  }
};

class Edge {
  constructor(n1, n2) {
    if (n1 < n2) {
      this.n1 = n1;
      this.n2 = n2;
    } else {
      this.n1 = n2;
      this.n2 = n1;
    }
    this.count = 1;
  }

  isEqual(otherEdge) {
    return this.n1 === otherEdge.n1 && this.n2 === otherEdge.n2;
  }

  toString() {
    return this.n1.toString() + '-' + this.n2.toString();
  }
}

class MeshEdges {
  constructor(mesh) {
    this.edges = new Map();

    let mdl = this;

    let addIfUnique = function(edge) {
      let e = mdl.edges.get(edge.toString());
      if (e !== undefined) {
        e.count += 1;
        return;
      }
      mdl.edges.set(edge.toString(), edge);
    }

    for (let egroup of mesh.elements) {
      let edgeIndices = null;

      if (egroup.type === 'HEXL8') {
        edgeIndices = Mesh.HEXL8.EDGE_INDICES;
      } else if (egroup.type === 'WEDL6') {
        edgeIndices = Mesh.WEDL6.EDGE_INDICES;
      } else if (egroup.type === 'TETL4') {
        edgeIndices = Mesh.TETL4.EDGE_INDICES;
      } else {
        throw 'Unsupported element type ' + egroup.type;
      }

      if (edgeIndices !== null) {
        for (let conn of egroup.connectivity) {
          for (let indexPair of edgeIndices) {
            addIfUnique(
              new Edge(conn[indexPair[0]] - 1, conn[indexPair[1]] - 1)
            );
          }
        }
      }
    }
  }
};

class NodeTracker {
  constructor() {
    this.vertexIndices = [];
    this.faceIndices = [];
  }

  addVertex(vertexIndex) {
    this.vertexIndices.push(vertexIndex);
  }

  addFace(faceIndex, faceVertex) {
    this.faceIndices.push([faceIndex, faceVertex]);
  }
};

module.exports = Model;
