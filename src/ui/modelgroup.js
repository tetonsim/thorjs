const THREE = require('three');

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

    this.defaultCutPlanes = {
      x: new THREE.Plane( new THREE.Vector3(-1, 0, 0), 0 ),
      y: new THREE.Plane( new THREE.Vector3(0, -1, 0), 0 ),
      z: new THREE.Plane( new THREE.Vector3(0, 0, -1), 0 ),
    }

    this.activeCutPlane = this.defaultCutPlanes.x.clone();
    
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

    this.setModel(model);
    if (results !== undefined) {
      this.setResults(results);
    }
  }

  reset() {
    // TODO
  }

  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  setModel(model) {
    this.reset();

    this.model = model;
    this.results = null;

    this.surface.visible = true;
    this.wireframe.visible = false;
    this.outline.visible = true;
    this.contour.visible = false;

    this.setGeometry();

    //this.resize(this.group.surface.geometry);
  }
  
  setResults(results) {
    this.results = results;
    this.step = this.results.steps[0].name;
  }

  setGeometry() {
    this.surface.geometry = this.model.meshGeometry(new THREE.Color(0x00fff0), true);
    this.surface.material = new THREE.MeshLambertMaterial({color: 0xacacac, side: THREE.DoubleSide, wireframe: false, transparent: true, opacity: 1.0});

    this.wireframe.geometry = this.model.wireframeGeometry(10);
    this.wireframe.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false, 
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 0, transparent: true});

    this.contour.geometry = this.model.meshGeometry(new THREE.Color(0x0000ff));
    this.contour.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, side: THREE.DoubleSide});

    this.outline.geometry = new THREE.EdgesGeometry(this.surface.geometry, this.outline_threshold);
    this.outline.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false, 
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 0, transparent: true})

    this.surface.geometry.computeBoundingBox();
    this.boundingBox = this.surface.geometry.boundingBox;

    // Set the position of the default cut planes based off the
    // center of the geometry bounding box
    let boxCenter = new THREE.Vector3();
    this.boundingBox.getCenter(boxCenter);

    this.defaultCutPlanes.x.constant = boxCenter.x;
    this.defaultCutPlanes.y.constant = boxCenter.y;
    this.defaultCutPlanes.z.constant = boxCenter.z;

    this.activeCutPlane = this.defaultCutPlanes.x.clone();
  }

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

  undeform() {
    for (let m of [this.surface, this.wireframe, this.contour, /*this.outline*/]) {
      this.results.undeform(this.model.mesh.nodes, m.geometry);
    }
    this.outline.geometry = new THREE.EdgesGeometry(this.surface.geometry, this.outline_threshold);

    this.state.deformation.active = false;
    this.state.deformation.scaleFactor = 0.0;
  }

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
    
    return this.state.contour.legend;
  }

  gaussPointContour(gaussPointResultName, gaussPoint, component) {
    let that = this;
    
    this.state.contour._update = function() {
      that.state.contour.legend =
        that.results.gaussPointContour(that.contour.geometry, that.step, gaussPointResultName, gaussPoint, component)
    };

    this.state.contour._update();

    this.state.contour.active = true;

    this.surface.visible = false;
    this.contour.visible = true;

    return this.state.contour.legend;
  }

  uncontour() {
    this.state.contour.active = false;
    this.surface.visible = true;
    this.contour.visible = false;
  }

  activateContourCutPlane(plane) {
    if (plane !== undefined) {
      this.activeCutPlane = plane;
    }
    this.contour.material.clippingPlanes = [this.activeCutPlane];
    return this.activeCutPlane;
  }

  deactivateContourCutPlane() {
    this.contour.material.clippingPlanes = [];
  }

};

module.exports = ModelGroup;
