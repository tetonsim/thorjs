const THREE = require('three');
const { Contour, FaceContour, VertexContour } = require('./contour');

class ResultMeta {
  constructor(result) {
    this.min = Array(result.size).fill(Infinity),
    this.max = Array(result.size).fill(-Infinity),
    this.magnitude = {
      available: false,
      min: Infinity,
      max: -Infinity
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

    this.magnitude.available = (magnitudeCalculator !== null);

    for (let val of result.values) {
      if ('data' in val) {
        for (let i = 0; i < result.size; i++) {
          this.min[i] = Math.min(this.min[i], val.data[i]);
          this.max[i] = Math.max(this.max[i], val.data[i]);
        }
        if (magnitudeCalculator !== null) {
          val.magnitude = magnitudeCalculator(val.data);
          this.magnitude.min = Math.min(this.magnitude.min, val.magnitude);
          this.magnitude.max = Math.max(this.magnitude.max, val.magnitude);
        }
      } else {
        for (let sval of val.values) {
          for (let i = 0; i < result.size; i++) {
            this.min[i] = Math.min(this.min[i], sval.data[i]);
            this.max[i] = Math.max(this.max[i], sval.data[i]);
          }
          if (magnitudeCalculator !== null) {
            sval.magnitude = magnitudeCalculator(sval.data);
            if (isNaN(sval.magnitude)) {
              console.error('NaN mises from: ', sval);
            }
            this.magnitude.min = Math.min(this.magnitude.min, sval.magnitude);
            this.magnitude.max = Math.max(this.magnitude.max, sval.magnitude);
          }
        }
      }
    }
  }
}

class StepMeta {
  constructor(step) {
    let inc = step.increments[0];

    inc.node_results.forEach(
      r => r.meta = new ResultMeta(r)
    );

    inc.gauss_point_results.forEach(
      r => r.meta = new ResultMeta(r)
    );

    this.results = [];

    if (inc.node_results.find(r => r.name === 'displacement') !== undefined) {
      this.results.push(
        {
          displayName: 'Displacement',
          location: 'node',
          name: 'displacement',
          components: [
            {
              displayName: 'Magnitude',
              component: 'magnitude'
            },
            {
              displayName: 'X',
              component: 0
            },
            {
              displayName: 'Y',
              component: 1
            },
            {
              displayName: 'Z',
              component: 2
            }
          ]
        }
      );
    }

    if (inc.gauss_point_results.find(r => r.name === 'stress') !== undefined) {
      this.results.push(
        {
          displayName: 'Stress',
          location: 'gauss_point',
          name: 'stress',
          components: [
            {
              displayName: 'von Mises',
              component: 'magnitude'
            },
            {
              displayName: 'XX',
              component: 0
            },
            {
              displayName: 'YY',
              component: 1
            },
            {
              displayName: 'ZZ',
              component: 2
            },
            {
              displayName: 'XY',
              component: 3
            },
            {
              displayName: 'XZ',
              component: 4
            },
            {
              displayName: 'YZ',
              component: 5
            }
          ]
        }
      );
    }

    if (inc.gauss_point_results.find(r => r.name === 'safety_factor') !== undefined) {
      this.results.push(
        {
          displayName: 'Factor of Safety',
          location: 'gauss_point',
          name: 'safety_factor',
          components: [
            {
              displayName: 'Homogenized',
              component: 0
            },
            {
              displayName: 'Layered',
              component: 1
            },
            {
              displayName: 'Delamination',
              component: 2
            }
          ]
        }
      );
    }
  }
};

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
        // try to parse int
        let temp = Number.parseInt(component);
        if (!isNaN(temp)) {
          component = temp;
        } else {
          throw 'Invalid gauss point result component: ' + component;
        }
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

/**
 * Exposes methods for handling FEA results in a UI.Canvas
 * @memberof UI
 * @param {FEA.Results} results
 */
class Results {
  constructor(results) {
    Object.assign(this, results);

    // Setup some meta information for users of this API
    this.steps.forEach(
      s => s.meta = new StepMeta(s)
    );
  }

  /**
   * Returns an array of step names in the results
   * @returns {Array<string>}
   */
  stepNames() {
    let names = [];
    for (let s of this.steps) {
      names.push(s.name);
    }
    return names;
  }

  getStep(stepName) {
    return this.steps.find( step => step.name === stepName );
  }

  nodeResults(stepName) {
    let step = this.getStep(stepName);
    let results = [];
    for (let r of step.increments[0].node_results) {
      results.push(
        {
          name: r.name,
          size: r.size
        }
      );
    }
    return results;
  }

  getNodeResult(stepName, resultVar) {
    let step = this.getStep(stepName);
    let result = step.increments[0].node_results.find( rslt => rslt.name === resultVar );
    return result;
  }

  gaussPointResults(stepName) {
    let step = this.getStep(stepName);
    let results = [];
    for (let r of step.increments[0].gauss_point_results) {
      results.push(
        {
          name: r.name,
          size: r.size
        }
      );
    }
    return results;
  }

  getGaussPointResult(stepName, resultVar) {
    let step = this.getStep(stepName);
    let result = step.increments[0].gauss_point_results.find( rslt => rslt.name === resultVar );
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
        // try to parse int
        let temp = Number.parseInt(component);
        if (!isNaN(temp)) {
          component = temp;
        } else {
          throw 'Invalid node result component: ' + component;
        }
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

  gaussPointToNodeContour(geom, stepName, gpResultName, filterParams) {
    let result = this.getGaussPointResult(stepName, gpResultName);
    let contour = new VertexContour(geom, Contour.paramsFromResult(result, filterParams.component || 0));
    let filter = new ResultFilter(result, filterParams);

    let elemVals = new Map();

    for (let val of result.values) {
      // Grab the element value based off the ResultFilter which
      // just finds a particular gauss point and returns its value.
      // If we want to extrapolate multiple gauss pt values to the nodes
      // we would need to replace this call with something that would extrapolate
      // and return a value for each node in the element connectivity.
      elemVals.set(val.id, filter.get(val.values));

      //geom.vertices[val.id - 1].resultValue = resultValue;
    }

    let nodeToVertexIter = geom.userData.nodeMap.entries();
    let nodeToVertex = nodeToVertexIter.next();

    contour.resetMinMax();

    while (!nodeToVertex.done) {
      let nodeId = nodeToVertex.value[0];
      let nodeTracker = nodeToVertex.value[1];
      let nodeElems = geom.userData.nodeElems.get(nodeId);

      let vertexValue = 0.0;
      for (let elemId of nodeElems) {
        vertexValue += elemVals.get(elemId);
      }
      
      vertexValue /= nodeElems.length;

      for (let i of nodeTracker.vertexIndices) {
        geom.vertices[i].resultValue = vertexValue;
      }

      contour.updateMinMax(vertexValue);

      nodeToVertex = nodeToVertexIter.next();
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
