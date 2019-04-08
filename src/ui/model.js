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
    this.groups = [];
  }

  /**
   * Creates and returns an undeformed Geometry of the model mesh
   * @returns {THREE.Geometry}
   */
  meshGeometry(initVertexColor=null, excludeSharedFaces=false) {
    let geom = new THREE.Geometry();
    //let geom = new THREE.BufferGeometry();

    let nodeMap = new Map();    // key: node Id, value: NodeTracker object
    let elemMap = new Map();    // key: elem Id, value: list of indices in geom.faces that construct the element
    let nodeElems = new Map();  // key: node Id, value: list of element Ids node is connected to

    geom.userData = {
      nodeMap: nodeMap,
      elemMap: elemMap,
      nodeElems: nodeElems
    };

    for (let node of this.mesh.nodes) {
      let pos = new THREE.Vector3(node[1], node[2], node[3]);

      geom.vertices.push(pos);

      let nt = new NodeTracker();
      nt.addVertex(geom.vertices.length - 1);

      nodeMap.set(node[0], nt);
      nodeElems.set(node[0], []);
    }

    let faceCounter = new Map();

    for (let egroup of this.mesh.elements) {
      let etype = Mesh.elementTypeFromString(egroup.type);

      if (etype === null) {
        throw 'Unsupported element type ' + egroup.type;
      }

      let faces = etype.FACES;

      if (faces !== null) {
        for (let conn of egroup.connectivity) {
          //let elemFaces = [];

          let nodeIter = conn.entries();
          let iconn = nodeIter.next();

          let elemId = iconn.value[1];
          
          // add this element to the map tracking which elements a node is connected to
          iconn = nodeIter.next();
          while (!iconn.done) {
            nodeElems.get(iconn.value[1]).push(elemId);
            iconn = nodeIter.next();
          }

          for (let face of faces) {
            //let trifaces = face.triangulate(conn);

            let nodeKey = face.nodeKey(conn);
            let facesToCreate = faceCounter.get(nodeKey);
            if (facesToCreate === undefined) {
              facesToCreate = [ [elemId, face.triangulate(conn)] ];
              faceCounter.set(nodeKey, facesToCreate);
            } else if (excludeSharedFaces) {
              faceCounter.set(nodeKey, []);; // this face is shared (internal) so make it empty so we ignore it
            } else {
              faceCounter.get(nodeKey).push( [elemId, face.triangulate(conn)] );
            }
          }
        }
      }
    }

    faceCounter.forEach(
      function(elements, nodeKey) {

        for (let elem of elements) {
          let elemId = elem[0];
          let trifaces = elem[1];
          let elemFaces = [];

          for (let ijk of trifaces) {
            //let tface = new THREE.Face3(conn[ijk[0]] - 1, conn[ijk[1]] - 1, conn[ijk[2]] - 1);
            let tface = new THREE.Face3(ijk[0] - 1, ijk[1] - 1, ijk[2] - 1);

            if (initVertexColor !== null) {
              tface.vertexColors = [
                new THREE.Color(initVertexColor),
                new THREE.Color(initVertexColor),
                new THREE.Color(initVertexColor)
              ];
            }

            geom.faces.push(tface);

            elemFaces.push(geom.faces.length - 1);

            for (let faceVertexIndex in ijk) {
              //let globalNodeId = conn[ijk[faceVertexIndex]];
              let globalNodeId = ijk[faceVertexIndex];

              let nmap = nodeMap.get(globalNodeId);
        
              /*if (nmap === undefined) {
                nmap = new NodeTracker();
                nodeMap.set(globalNodeId, nmap);
              }*/

              nmap.addFace(geom.faces.length - 1, faceVertexIndex);
            }
          }

          if (elemMap.has(elemId)) {
            elemMap.get(elemId).push(...elemFaces);
          } else {
            elemMap.set(elemId, elemFaces);
          }
        }

      }
    )

    geom.computeFaceNormals();
    //geom.computeVertexNormals();
    geom.computeBoundingBox();

    return geom;
  }

  wireframeGeometry(maxShare = 2) {
    let lgeom = new THREE.Geometry();

    let nodeMap = new Map();
    let elemMap = new Map();

    lgeom.userData = {
      nodeMap: nodeMap,
      //elemMap: elemMap
    };

    for (let [key, edge] of this.edges.edges) {
      if (edge.count > maxShare) {
        continue;
      }

      let n1 = this.mesh.nodes[edge.n1];
      let n2 = this.mesh.nodes[edge.n2];
      
      let v1 = new THREE.Vector3(n1[1], n1[2], n1[3]);
      let v2 = new THREE.Vector3(n2[1], n2[2], n2[3]);

      lgeom.vertices.push(v1, v2);

      let n1map = nodeMap.get(n1[0]);
      let n2map = nodeMap.get(n2[0]);

      if (n1map === undefined) {
        n1map = new NodeTracker();
        nodeMap.set(n1[0], n1map);
      }

      if (n2map === undefined) {
        n2map = new NodeTracker();
        nodeMap.set(n2[0], n2map);
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
      let etype = Mesh.elementTypeFromString(egroup.type);

      if (etype === null) {
        throw 'Unsupported element type ' + egroup.type;
      }

      let edgeIndices = etype.EDGE_INDICES;

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

class FaceCounter {
  constructor() {
    this.faces = [];
  }

  get count() {
    return this.faces;
  }
}

module.exports = Model;
