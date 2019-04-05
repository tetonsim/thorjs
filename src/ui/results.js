const THREE = require('three');
const { Contour, FaceContour, VertexContour } = require('./contour');

function computeMetaInfo(result) {
  meta = {
    min: Array(result.size).fill(Infinity),
    max: Array(result.size).fill(-Infinity),
    magnitude: {
      available: false,
      min: Infinity,
      max: -Infinity
    }
  };

  let magnitudeCalculator = null;
  if (result.name === 'displacement' || result.name === 'force') {
    magnitudeCalculator = d => Math.sqrt(d[0]**2 + d[1]**2 + d[2]**2);
  } else if (result.name === 'stress') {
    // von mises
    if (result.size === 3) {
      magnitudeCalculator = d => Math.sqrt(d[0]**2 + d[1]**2 + d[0] * d[1] + 3 * d[2]**2);
    } else if (result.size === 6) {
      magnitudeCalculator = d => Math.sqrt(
        d[0]**2 + d[1]**2 + d[2]**2 - 
        (d[0] * d[1] + d[1] * d[2] + d[0] * d[2]) + 
        3 * (d[3]**2 + d[4]**2 + d[5]**2)
      );
    }
  }

  meta.magnitude.available = (magnitudeCalculator !== null);

  for (let val of result.values) {
    if ('data' in val) {
      for (let i = 0; i < result.size; i++) {
        meta.min[i] = Math.min(meta.min[i], val.data[i]);
        meta.max[i] = Math.max(meta.max[i], val.data[i]);
      }
      if (magnitudeCalculator !== null) {
        val.magnitude = magnitudeCalculator(val.data);
        meta.magnitude.min = Math.min(meta.magnitude.min, val.magnitude);
        meta.magnitude.max = Math.max(meta.magnitude.max, val.magnitude);
      }
    } else {
      for (let sval of val.values) {
        for (let i = 0; i < result.size; i++) {
          meta.min[i] = Math.min(meta.min[i], sval.data[i]);
          meta.max[i] = Math.max(meta.max[i], sval.data[i]);
        }
        if (magnitudeCalculator !== null) {
          sval.magnitude = magnitudeCalculator(sval.data);
          if (isNaN(sval.magnitude)) {
            console.error('NaN mises from: ', sval);
          }
          meta.magnitude.min = Math.min(meta.magnitude.min, sval.magnitude);
          meta.magnitude.max = Math.max(meta.magnitude.max, sval.magnitude);
        }
      }
    }
  }

  result.meta = meta;
}

class ResultFilter {
  constructor(result, params) {
    if (params === undefined) {
      params = {};
    }

    let component = params.component || 0;
    let gaussPoint = params.gaussPoint || 0;
    let layer = params.layer || 0;
    let sectionPoint = params.sectionPoint || 0;

    this.componentRetriever = v => v.data[component];
    this.layerFilter = null;
    this.valuePicker = null;

    // First let's setup a function to retrieve the component, or
    // compute the component if necessary

    if (typeof component === 'string') {
      component = component.toUpperCase();
      if (component === 'MAGNITUDE') {
        this.componentRetriever = v => v.magnitude;
        if (!result.meta.magnitude.available) {
          throw 'Magnitude not available for gauss point result ' + result.name;
        }
      } else {
        throw 'Invalid gauss point result component: ' + component;
      }
    } else if (typeof component === 'function') {
      this.componentRetriever = component;
    }

    // Now let's setup a function to filter results within an element by layer, section point, etc.
    if (layer > 0) {
      // Start with a filter on layer number, and section point number, if provided
      if (sectionPoint > 0) {
        this.layerFilter = v => ((v.l || 0) === layer && (v.k || 0) === sectionPoint);
      } else {
        this.layerFilter = v => (v.l || 0) === layer;
      }
    }

    // Create a function to pick out a result value from the filtered list
    // This could be a simple as grabbing a specific gauss point
    // or could be a function that seeks for the maximum value, for example
    let that = this;
    if (typeof gaussPoint === 'number') {

      this.valuePicker = function(values) {
        if (values.length > gaussPoint) {
          return that.componentRetriever(values[gaussPoint]);
        }
        return NaN;
      }

    } else if (typeof gaussPoint === 'string') {

      gaussPoint = gaussPoint.toUpperCase();

      if (gaussPoint === 'MAX') {
        this.valuePicker = function(values) {
          if (values.length === 0) {
            return NaN;
          }
          let maxval = -Infinity;
          for (let sval of values) {
            maxval = Math.max(maxval, that.componentRetriever(sval));
          }
          return maxval;
        }
      } else if (gaussPoint === 'MIN') {
        this.valuePicker = function(values) {
          if (values.length === 0) {
            return NaN;
          }
          let minval = Infinity;
          for (let sval of values) {
            minval = Math.min(minval, that.componentRetriever(sval));
          }
          return minval;
        }
      } else if (gaussPoint === 'MAXABS') {
        this.valuePicker = function(values) {
          if (values.length === 0) {
            return NaN;
          }
          let maxval = 0;
          for (let sval of values) {
            let svalc = that.componentRetriever(sval);
            if (Math.abs(svalc) > Math.abs(maxval)) {
              maxval = svalc;
            }
          }
          return maxval;
        }
      } else {
        throw 'Invalid gaussPoint input: ' + gaussPoint;
      }

    } else {
      throw 'Invalid gaussPoint input type: ' + gaussPoint;
    }
  }

  get(values) {
    if (this.layerFilter !== null) {
      return this.valuePicker(values.filter(this.layerFilter));
    }
    return this.valuePicker(values);
  }
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

  deform(nodes, geom, stepName, params={}) {
    let deformationVar = 'displacement';
    if (params.deformationVar) {
      deformationVar = params.deformationVar;
    }

    // Get the step node result
    let result = this.getNodeResult(stepName, deformationVar);

    let scaleFactor = 1.0;
    if (params.scaleFactor) {
      scaleFactor = params.scaleFactor;
    } else if (params.boundingBox) {
      const sizePercentTarget = 0.05;
      let boxSize = new THREE.Vector3();
      params.boundingBox.getSize(boxSize);
      scaleFactor = Math.min(
        sizePercentTarget * boxSize.x / Math.max(1.0E-12, Math.abs(result.meta.max[0])),
        sizePercentTarget * boxSize.y / Math.max(1.0E-12, Math.abs(result.meta.max[1])),
        sizePercentTarget * boxSize.z / Math.max(1.0E-12, Math.abs(result.meta.max[2]))
      );
    }

    let nodeMap = geom.userData.nodeMap;

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

      if (nodeMap === undefined) {
        deformVertex(geom.vertices[val.id - 1]);
      } else {
        let nodeTracker = nodeMap.get(node[0]);
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

    return scaleFactor;
  }

  /**
   * Return geometry to undeformed state
   * @param {*} nodes 
   * @param {*} geom 
   */
  undeform(nodes, geom) {
    let nodeMap = geom.userData.nodeMap;

    for (let node of nodes) {
      function revertVertex(vertex) {
        vertex.x = node[1];
        vertex.y = node[2];
        vertex.z = node[3];
      }

      if (nodeMap === undefined) {
        revertVertex(geom.vertices[node[0] - 1]);
      } else {
        let nodeTracker = nodeMap.get(node[0]);
        if (nodeTracker !== undefined) {
          if (nodeTracker.vertexIndices.length > 0) {
            for (let vIndex of nodeTracker.vertexIndices) {
              revertVertex(geom.vertices[vIndex]);
            }
          } else {
            revertVertex(geom.vertices[node[0] - 1]);
          }
        }
      }
    }

    geom.verticesNeedUpdate = true;
  }

  nodeContour(geom, stepName, nodeResultName, component=0) {
    let result = this.getNodeResult(stepName, nodeResultName);
    let contour = new VertexContour(geom, Contour.paramsFromResult(result, component));

    if (typeof component === 'string') {
      component = component.toUpperCase();
      if (component === 'MAGNITUDE') {
        if (!result.meta.magnitude.available) {
          throw 'Magnitude not available for node result ' + result.name;
        }
      } else {
        throw 'Invalid node result component: ' + component;
      }
    }    

    for (let val of result.values) {
      let resultValue = 0.0;
      if (component === 'MAGNITUDE') {
        resultValue = val.magnitude;
      } else {
        resultValue = val.data[component];
      }

      geom.vertices[val.id - 1].resultValue = resultValue;
    }

    contour.updateVertexColors();

    return contour;
  }

  gaussPointContour(geom, stepName, gpResultName, filterParams) {
    let result = this.getGaussPointResult(stepName, gpResultName);
    let contour = new FaceContour(geom, Contour.paramsFromResult(result, filterParams.component || 0));
    let filter = new ResultFilter(result, filterParams);

    let elemMap = geom.userData.elemMap;

    contour.resetMinMax();

    for (let val of result.values) {
      let faceIndices = elemMap.get(val.id);

      if (faceIndices === undefined) {
        continue;
      }

      //let faceValue = valueRetriever(val.values);
      let faceValue = filter.get(val.values);

      contour.updateMinMax(faceValue);

      for (let faceIndex of faceIndices) {
        let face = geom.faces[faceIndex];

        face.resultValue = faceValue;
      }
    }

    contour.updateVertexColors();

    return contour;
  }
}

module.exports = Results;
