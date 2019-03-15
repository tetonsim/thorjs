const THREE = require('three');
const Contour = require('./contour');

class Results {
  constructor(results) {
    Object.assign(this, results);
  }

  steps() {
    let stepNames = [];
    for (let s of this.steps) {
      stepNames.push(s.name);
    }
    return stepNames;
  }

  getStep(stepName) {
    return this.steps.find( step => step.name === stepName );
  }

  getNodeResult(stepName, resultVar) {
    let step = this.getStep(stepName);
    return step.increments[0].node_results.find( rslt => rslt.name === resultVar );
  }

  nodeResults(stepName) {
    let step = this.getStep(stepName);
    let results = {};
    for (let r of step.increments[0].node_results) {
      results[r.name] = {
        size: r.size
      };
    }
    return rsltNames;
  }

  deform(nodes, geom, stepName, scaleFactor=1.0, deformationVar='displacement') {
    // Get the step node result
    let result = this.getNodeResult(stepName, deformationVar);

    for (let val of result.values) {
      let node = nodes[val.id - 1]; // original, undeformed coordinates
      
      if (node[0] !== val.id) {
        throw 'Unexpected node id mismatch';
      }

      function deformVertex(vertex) {
        vertex.x = node[1] + scaleFactor * val.data[0];
        vertex.y = node[2] + scaleFactor * val.data[1];
        vertex.z = node[3] + scaleFactor * val.data[2];
      }

      if (geom.nodeMap === undefined) {
        deformVertex(geom.vertices[val.id - 1]);
      } else {
        let nodeTracker = geom.nodeMap.get(node[0]);
        if (nodeTracker !== undefined) {
          if (nodeTracker.vertexIndices.length > 0) {
            for (let vIndex of nodeTracker.vertexIndices) {
              deformVertex(geom.vertices[vIndex]);
            }
          } else {
            deformVertex(geom.vertices[val.id - 1]);
          }
        }
      }
    }

    geom.verticesNeedUpdate = true;
  }

  contour(geom, stepName, nodeRsltName, component=0) {
    let result = this.getNodeResult(stepName, nodeRsltName);
    let contour = new Contour.Node(result, component);

    for (let val of result.values) {
      let nmap = geom.nodeMap.get(val.id);

      if (nmap === undefined) {
        continue;
      }

      for (let faceIndex of nmap.faceIndices) {
        let face = geom.faces[faceIndex[0]];
        face.vertexColors[faceIndex[1]].set(
          contour.color(val.data[component])
        );
      }
    }

    geom.colorsNeedUpdate = true;
  }
}

module.exports = Results;
