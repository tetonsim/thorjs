const THREE = require('three');
const Contour = require('./contour');

function computeMetaInfo(result) {
  meta = {
    min: Array(result.size).fill(Infinity),
    max: Array(result.size).fill(-Infinity)
  };

  for (let val of result.values) {
    if ('data' in val) {
      for (let i = 0; i < result.size; i++) {
        meta.min[i] = Math.min(meta.min[i], val.data[i]);
        meta.max[i] = Math.max(meta.max[i], val.data[i]);
      }
    } else {
      for (let sval of val.values) {
        for (let i = 0; i < result.size; i++) {
          meta.min[i] = Math.min(meta.min[i], sval.data[i]);
          meta.max[i] = Math.max(meta.max[i], sval.data[i]);
        }
      }
    }
  }

  result.meta = meta;
}

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

  nodeResults(stepName) {
    let step = this.getStep(stepName);
    let results = {};
    for (let r of step.increments[0].node_results) {
      results[r.name] = {
        size: r.size
      };
    }
    return results;
  }

  getNodeResult(stepName, resultVar) {
    let step = this.getStep(stepName);
    let result = step.increments[0].node_results.find( rslt => rslt.name === resultVar );

    if (!('meta' in result)) {
      computeMetaInfo(result);
    }

    return result;
  }

  gaussPointResults(stepName) {
    let step = this.getStep(stepName);
    let results = {};
    for (let r of step.increments[0].gauss_point_results) {
      results[r.name] = {
        size: r.size
      };
    }
    return results;
  }

  getGaussPointResult(stepName, resultVar) {
    let step = this.getStep(stepName);
    let result = step.increments[0].gauss_point_results.find( rslt => rslt.name === resultVar );

    if (!('meta' in result)) {
      computeMetaInfo(result);
    }

    return result;
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

  nodeContour(geom, stepName, nodeResultName, component=0) {
    let result = this.getNodeResult(stepName, nodeResultName);
    let contour = new Contour(result, component);

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

  gaussPointContour(geom, stepName, gpResultName, gaussPoint, component=0) {
    let result = this.getGaussPointResult(stepName, gpResultName);
    let contour = new Contour(result, component);

    for (let val of result.values) {
      let faceIndices = geom.elemMap.get(val.id);

      if (faceIndices === undefined) {
        continue;
      }

      for (let faceIndex of faceIndices) {
        let face = geom.faces[faceIndex];
        let faceColor = new THREE.Color(0xffffff); // default in case this element doesn't have the request gp
        
        if (val.values.length > gaussPoint) {
          let sval = val.values[gaussPoint];
          faceColor = contour.color(sval.data[component]);
        }

        for (let vcolor of face.vertexColors) {
          vcolor.set(faceColor);
        }
      }
    }

    geom.colorsNeedUpdate = true;
  }
}

module.exports = Results;
