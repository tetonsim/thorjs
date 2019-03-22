const THREE = require('three');
const TrackballControls = require('./TrackballControls');
const Model = require('./model');
const Results = require('./results');
const Sizer = require('./sizer');

class Canvas {
  constructor() {
  }

  init(container) {
    this.container = container;

    this.model = null;
    this.results = null;
    this.step = null;
    this.sizer = null;

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

    this.renderer = new THREE.WebGLRenderer( { antialias: true });

    let W = this.container.clientWidth;
    let H = this.container.clientHeight;

    this.renderer.setSize(W, H);

    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0xffffff);
    
    this.camera = new THREE.PerspectiveCamera(10, W / H, 1, 10000);
    this.ambient = new THREE.AmbientLight(0x808080);
    this.headlamp = new THREE.DirectionalLight(0xffffff, 0.5);

    this.scene.add(this.camera);
    this.scene.add(this.ambient);
    this.scene.add(this.headlamp);

    this.axesHelper = new THREE.AxesHelper(1);
    this.axesHelper.userData.size = 1;
    this.scene.add(this.axesHelper);

    this.controls = new THREE.TrackballControls(this.camera, this.container);
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.25; // only applicable if staticMoving is false
    this.controls.rotateSpeed = 3.0;
    this.controls.zoomSpeed = 2.0;
    this.controls.panSpeed = 0.4;

    this.meshes = new THREE.Group();
    this.surface = new THREE.Mesh();
    this.contour = new THREE.Mesh();
    this.wireframe = new THREE.LineSegments();
    this.outline = new THREE.LineSegments();

    this.surface.visible = false;
    this.contour.visible = false;
    this.wireframe.visible = false;
    this.outline.visible = false;

    this.meshes.add(this.surface, this.contour, this.wireframe, this.outline);

    this.scene.add(this.meshes);

    this.update();
  }

  reset() {
    /*var objs = [this.meshes];
    for (var obj of objs) {
        while (obj.children.length) {
            obj.children.pop();
        } 
    }*/
  }

  update() {
    this.headlamp.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  setModel(model) {
    this.reset();

    this.model = new Model(model);
    this.results = null;

    this.surface.geometry = this.model.meshGeometry(new THREE.Color(0x00fff0), true);
    this.surface.material = new THREE.MeshLambertMaterial({color: 0xacacac, side: THREE.FrontSide, wireframe: false});

    this.wireframe.geometry = this.model.wireframeGeometry();
    this.wireframe.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false, 
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 0, transparent: true});

    this.contour.geometry = this.model.meshGeometry(new THREE.Color(0x0000ff));
    this.contour.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, side: THREE.FrontSide});

    this.outline.geometry = new THREE.EdgesGeometry(this.surface.geometry, 10);
    this.outline.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false, 
      depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 4, polygonOffsetUnits: 0, transparent: true})

    //this.meshes.add(mesh);

    this.surface.visible = true;
    this.wireframe.visible = true;
    this.outline.visible = false;

    this.resize(this.surface.geometry);
  }
  
  setResults(results) {
    this.results = new Results(results);
    this.step = this.results.steps[0].name;
  }

  setStep(stepName) {
    let s = this.results.getStep(stepName);
    if (s === undefined) {
      throw 'Invalid step ' + stepName;
    }
    this.step = stepName;

    // deform the geometry under the new step, if we're in a deformed state
    if (this.state.deformation.active) {
      this.deform(this.state.deformation.scaleFactor);
    }

    if (this.state.contour.active) {
      this.state.contour._update();
    }
  }

  deform(scaleFactor=1.0) {
    for (let m of [this.surface, this.wireframe, this.contour]) {
      this.results.deform(this.model.mesh.nodes, m.geometry, this.step, scaleFactor);
    }
    
    this.state.deformation.active = true;
    this.state.deformation.scaleFactor = scaleFactor;
  }

  undeform() {
    for (let m of [this.surface, this.wireframe, this.contour]) {
        this.results.undeform(this.model.mesh.nodes, m.geometry);
    }

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
        that.results.gaussPointContour(that.contour.geometry, that.step, gaussPointResultName, gaussPoint, component);
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

  resize(box) {
    this.sizer = new Sizer(box);

    this.camera.near = this.sizer.camera.near;
    this.camera.far = this.sizer.camera.far;
    this.camera.position.set(
      this.sizer.camera.position.x,
      this.sizer.camera.position.y,
      this.sizer.camera.position.z
    );

    this.camera.updateProjectionMatrix();

    this.controls.target.set(
      this.sizer.center.x,
      this.sizer.center.y,
      this.sizer.center.z,
    );

    this.headlamp.target = this.meshes;

    let axesScale = this.sizer.axesHelper / this.axesHelper.userData.size;
    this.axesHelper.userData.size = this.sizer.axesHelper;
    this.axesHelper.geometry.scale(axesScale, axesScale, axesScale);
  }

  toggleSurface() {
    this.surface.visible = !this.surface.visible;
  }

  toggleWireframe() {
    this.wireframe.visible = !this.wireframe.visible;
  }

  toggleContour() {
    this.contour.visible = !this.contour.visible;
  }

  center() {
    this.controls.target.copy(
      this.sizer.center
    );
  }
  
  zoomToFit(zoomOutFactor=1.1, dz=0) {
    this.center();

    // vdist is the distance vector from the current camera position to the center
    let vdist = this.sizer.center.clone();
    vdist.negate();
    vdist.add(this.camera.position);

    /*
    // Get the bounding box in the camera view's frame of reference
    let rbox = this.sizer.box.clone();
    let rotM = new THREE.Matrix4();

    rotM.makeRotationFromEuler(this.camera.rotation);

    let rotMInv = new THREE.Matrix4();
    rotMInv.getInverse(rotM);

    rbox.applyMatrix4(rotMInv);

    let hx = Math.abs(rbox.max.x - rbox.min.x);
    let hy = Math.abs(rbox.max.y - rbox.min.y);
    let cz = Math.abs(rbox.max.z + rbox.min.z) / 2;
    */

    // For now we're just using the bounding sphere radius. This will
    // result in a conservative zoom factor
    let hx = 2 * this.sizer.sphere.radius;
    let hy = 2 * this.sizer.sphere.radius;

    let fovRadians = this.camera.fov * Math.PI / 180.0;
    let filledDistX = hx / (2 * Math.tan(fovRadians / 2)) / this.camera.aspect;
    let filledDistY = hy / (2 * Math.tan(fovRadians / 2));

    let filledDist = Math.max(filledDistX, filledDistY);

    let vdistLen = Math.abs(vdist.length());

    if (vdistLen < 1.0E-10 * this.sizer.maxDimension()) {
      return;
    }

    let zoom = Math.abs(filledDist / vdistLen);

    zoom = zoomOutFactor * Math.abs(zoom);

    this.camera.position.set(
      this.sizer.center.x + zoom * (this.camera.position.x - this.sizer.center.x),
      this.sizer.center.y + zoom * (this.camera.position.y - this.sizer.center.y),
      this.sizer.center.z + zoom * (this.camera.position.z - this.sizer.center.z)
    )
  }

  setViewFromVectors(position, up) {
    this.camera.position.copy(position);
    this.camera.up.copy(up);
    this.zoomToFit();
  }

  setView(view) {
    this.setViewFromVectors(view.position, view.up);
  }

  get views() {
    let s = this.sizer;
    return {
      XY: {
        position: new THREE.Vector3(s.center.x, s.center.y, s.dim.z),
        up: new THREE.Vector3(0, 1, 0)
      },

      XZ: {
        position: new THREE.Vector3(s.center.x, -s.dim.y, s.center.z),
        up: new THREE.Vector3(0, 0, 1)
      },

      YZ: {
        position: new THREE.Vector3(s.dim.x, s.center.y, s.center.z),
        up: new THREE.Vector3(0, 0, 1)
      },

      isometric: {
        position: s.camera.position.clone(),
        up: new THREE.Vector3(0, 1, 0)
      }
    }
  }
};

module.exports = Canvas;