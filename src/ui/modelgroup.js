const THREE = require('three');

/**
 * A cut plane
 */
class CutPlane {
  constructor(name, plane) {
    this.name = name;
    this.plane = plane;
    this.setSize(-1, 1);
  }

  setSize(minConstant, maxConstant, sign=1) {
    this.sign = sign;
    this.minConstant = minConstant;
    this.maxConstant = maxConstant;
    this.setPosition(0.5);
  }

  setPosition(n) {
    this.plane.constant = this.sign * (this.minConstant + n * (this.maxConstant - this.minConstant));
  }

  getPosition() {
    return (this.sign * this.plane.constant - this.minConstant) / (this.maxConstant - this.minConstant);
  }

  clone() {
    let cut = new CutPlane(this.name, this.plane.clone());
    cut.setSize(this.minConstant, this.maxConstant, this.sign);
    return cut;
  }
}

/**
 * Manages the THREE objects for a given UI.Model and optional UI.Results.
 * All meshes are handled through a THREE.Group object.
 * @memberof UI
 * @param {string} name 
 * @param {UI.Model} model 
 * @param {UI.Results} results 
 */
class ModelGroup {
  constructor(name, model, results) {
    this.name = name;

    this.state = {
      deformation: {
        active: false,
        scaleFactor: 0.0
      },
      contour: {
        active: false,
        legend: null,
        _update: null
      }
    };

    this.model = null;
    this.results = null;
    this.step = null;
    this.boundingBox = null;

    this.defaultCutPlanes = [
      new CutPlane('X+', new THREE.Plane( new THREE.Vector3(-1, 0, 0), 0 )),
      new CutPlane('X-', new THREE.Plane( new THREE.Vector3(1, 0, 0), 0 )),
      new CutPlane('Y+', new THREE.Plane( new THREE.Vector3(0, -1, 0), 0 )),
      new CutPlane('Y-', new THREE.Plane( new THREE.Vector3(0, 1, 0), 0 )),
      new CutPlane('Z+', new THREE.Plane( new THREE.Vector3(0, 0, -1), 0 )),
      new CutPlane('Z-', new THREE.Plane( new THREE.Vector3(0, 0, 1), 0 ))
    ];

    this.activeCutPlane = this.defaultCutPlanes[0].plane.clone();
    
    this.group = new THREE.Group();
    
    this.surface = new THREE.Mesh();
    this.contour = new THREE.Mesh();
    this.wireframe = new THREE.LineSegments();
    this.outline = new THREE.LineSegments();

    this.surface.visible = false;
    this.contour.visible = false;
    this.wireframe.visible = false;
    this.outline.visible = false;

    this.group.add(
      this.surface,
      this.contour,
      this.wireframe,
      this.outline
    );

    this.outline_threshold = 30;

    this._setModel(model);
    if (results !== undefined) {
      this._setResults(results);
    }
  }

  reset() {
    // TODO
  }

  /**
   * Makes the underlying THREE.Group visible
   */
  show() {
    this.group.visible = true;
  }

  /**
   * Makes the underlying THREE.Group not visible
   */
  hide() {
    this.group.visible = false;
  }

  _setModel(model) {
    this.reset();

    this.model = model;
    this.results = null;

    this.surface.visible = true;
    this.wireframe.visible = false;
    this.outline.visible = true;
    this.contour.visible = false;

    this._setGeometry();

    //this.resize(this.group.surface.geometry);
  }
  
  _setResults(results) {
    this.results = results;
    this.step = this.results.steps[0].name;
  }

  _setGeometry() {
    this.surface.geometry = this.model.meshGeometry(new THREE.Color(0x00fff0), true);
    this.surface.material = new THREE.MeshLambertMaterial({color: 0xacacac, side: THREE.DoubleSide, wireframe: false, transparent: false, opacity: 1.0});

    this.wireframe.geometry = this.model.wireframeGeometry();
    this.wireframe.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false, 
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 0, transparent: true});

    this.contour.geometry = this.model.meshGeometry(new THREE.Color(0x0000ff));
    this.contour.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, side: THREE.DoubleSide});

    // Create the custom HSL_COLOR_SPACE definition that is used to interpolate
    // vertex colors in HSL space. See the shaders in customizeThree.patchLambertMaterial
    this.contour.material.defines = this.contour.material.defines || {};
    this.contour.material.defines['HSL_COLOR_SPACE'] = '';

    this.outline.geometry = new THREE.EdgesGeometry(this.surface.geometry, this.outline_threshold);
    this.outline.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false, 
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 0, transparent: true})

    this.surface.geometry.computeBoundingBox();
    this.boundingBox = this.surface.geometry.boundingBox;

    // Set the position of the default cut planes
    this.defaultCutPlanes.find(p => p.name === 'X+').setSize(this.boundingBox.min.x, this.boundingBox.max.x);
    this.defaultCutPlanes.find(p => p.name === 'X-').setSize(this.boundingBox.min.x, this.boundingBox.max.x, -1);
    this.defaultCutPlanes.find(p => p.name === 'Y+').setSize(this.boundingBox.min.y, this.boundingBox.max.y);
    this.defaultCutPlanes.find(p => p.name === 'Y-').setSize(this.boundingBox.min.y, this.boundingBox.max.y, -1);
    this.defaultCutPlanes.find(p => p.name === 'Z+').setSize(this.boundingBox.min.z, this.boundingBox.max.z);
    this.defaultCutPlanes.find(p => p.name === 'Z-').setSize(this.boundingBox.min.z, this.boundingBox.max.z, -1);

    this.activeCutPlane = this.defaultCutPlanes[0].clone();
  }

  /**
   * Sets the active results step. If the ModelGroup is in a deformed or contour state
   * the deformation and/or contour will be updated automatically to reflect the step change.
   * @param {string} stepName 
   */
  setStep(stepName) {
    let s = this.results.getStep(stepName);
    if (s === undefined) {
      throw 'Invalid step ' + stepName;
    }
    this.step = stepName;

    // deform the geometry under the new step, if we're in a deformed state
    if (this.state.deformation.active) {
      this.deform();
    }

    if (this.state.contour.active) {
      this.state.contour._update();
    }
  }

  /**
   * Updates the geometries into a deformed state (the displacement node result
   * must be present in the UI.Results).
   * @param {number} [scaleFactor] The factor to multiply node/vertex displacements by.
   *  If not provided a default will be computed to ensure the deformation is visible.
   */
  deform(scaleFactor=undefined) {
    let usedScaleFactor = 0.0;

    for (let m of [this.surface, this.wireframe, this.contour, /*this.outline*/]) {
      usedScaleFactor = 
        this.results.deform(this.model.mesh.nodes, m.geometry, this.step, {scaleFactor: scaleFactor, boundingBox: this.boundingBox});
    }

    this.outline.geometry = new THREE.EdgesGeometry(this.surface.geometry, this.outline_threshold);
    
    this.state.deformation.active = true;
    this.state.deformation.scaleFactor = usedScaleFactor;
  }

  /**
   * If in a deformed state, this function will revert to the original, undeformed, geometry.
   */
  undeform() {
    for (let m of [this.surface, this.wireframe, this.contour, /*this.outline*/]) {
      this.results.undeform(this.model.mesh.nodes, m.geometry);
    }
    this.outline.geometry = new THREE.EdgesGeometry(this.surface.geometry, this.outline_threshold);

    this.state.deformation.active = false;
    this.state.deformation.scaleFactor = 0.0;
  }

  /**
   * Shows the contour geometry, hides the surface geometry and updates the contour
   * colors to reflect the specified parameters.
   * @param {string} nodeResultName Name of the node result, e.g. displacement
   * @param {number|string} component The result component/index, or 'magnitude'
   */
  nodeContour(nodeResultName, component) {
    let that = this;
    
    this.state.contour._update = function() {
      that.state.contour.legend = 
        that.results.nodeContour(that.contour.geometry, that.step, nodeResultName, component);
    }

    this.state.contour._update();

    this.state.contour.active = true;

    this.surface.visible = false;
    this.contour.visible = true;
  }

  /**Shows the contour geometry, hides the surface geometry and updates the contour
   * colors to reflect the specified parameters.
   * @param {string} gaussPointResultName Name of the gauss point result, e.g. stress
   * @param {Object} filterParams
   * @param {number|string} [filterParams.component=0] Result component/index, or 'magnitude' if applicable
   * @param {number|string} [filterParams.gaussPoint=0] The gauss point index in the element, or one of 'min', 'max', or 'maxabs'
   * @param {number} [filterParams.layer=0] Layer number. If 0, all layers are considered if layers exist
   * @param {number} [filterParams.sectionPoint=0] Section point number. If 0, all section points are considered if layers exist.
   * @param {boolean} [quilt=false] If true a quilt plot is created, rather than a contour plot
   */
  gaussPointContour(gaussPointResultName, filterParams, quilt=false) {
    let that = this;
    
    this.state.contour._update = function() {
      if (quilt) {
        that.state.contour.legend =
          that.results.gaussPointContour(that.contour.geometry, that.step, gaussPointResultName, filterParams)
      } else {
        that.state.contour.legend =
          that.results.gaussPointToNodeContour(that.contour.geometry, that.step, gaussPointResultName, filterParams)
      }
    };

    this.state.contour._update();

    this.state.contour.active = true;

    this.surface.visible = false;
    this.contour.visible = true;
  }

  /**
   * If the ModelGroup is showing a contour, this function reverts to a non-contour
   * state by hiding the contour geometry and showing the surface geometry.
   */
  uncontour() {
    this.state.contour.active = false;
    this.surface.visible = true;
    this.contour.visible = false;
  }

  /**
   * Enable a cut plane on the contour geometry. See ModelGroup.defaultCutPlanes for an array
   * of default cut planes.
   * @param {CutPlane} [plane] Cut plane. If not specified, the previous active cut plane
   *  is used. The active cut plane is initialized to a default plane if one was never activated.
   */
  activateContourCutPlane(plane) {
    if (plane !== undefined) {
      this.activeCutPlane = plane;
    }
    this.contour.material.clippingPlanes = [this.activeCutPlane.plane];
    return this.activeCutPlane;
  }

  /**
   * Deactivates any and all cut planes on the contour geometry.
   */
  deactivateContourCutPlane() {
    this.contour.material.clippingPlanes = [];
  }

};

module.exports = ModelGroup;
