const THREE = require('three');
const TrackballControls = require('./TrackballControls');
const ModelGroup = require('./modelgroup');
const Model = require('./model');
const Results = require('./results');
const Sizer = require('./sizer');

class Canvas {
  constructor() {
  }

  init(container) {
    this.container = container;

    this.sizer = null;

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

    this.groups = [];

    this.update();
  }

  reset() {
    let scene = this.scene;
    this.groups.forEach(
      function(g) {
        scene.remove(g.group);
        g.reset();
      }
    );
    this.groups = [];
  }

  update() {
    this.headlamp.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  newModelGroup(name, model, results=undefined) {
    let g = new ModelGroup(name, model, results);
    
    this.groups.push(g);
    this.scene.add(g.group);

    this.resize(g.surface.geometry);

    return g;
  }

  // TODO - how to handle sizing with multiple ModelGroups?
  resize(geom) {
    this.sizer = new Sizer(geom);

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

    this.headlamp.target = this.groups[0].group;

    let axesScale = this.sizer.axesHelper / this.axesHelper.userData.size;
    this.axesHelper.userData.size = this.sizer.axesHelper;
    this.axesHelper.geometry.scale(axesScale, axesScale, axesScale);
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