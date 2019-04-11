const THREE = require('three');
const TrackballControls = require('./TrackballControls');
const ModelGroup = require('./modelgroup');
const Sizer = require('./sizer');

/**
 * @memberof UI
 */
class Canvas {
  constructor() {
    this._init = false;
  }

  /**
   * Initializes the Canvas and appends an HTML canvas element
   * to the given container element. This MUST be called before
   * any other Canvas method can be called.
   * @param {HTMLElement} container 
   */
  init(container) {
    this.container = container;

    this.sizer = null;

    this.renderer = new THREE.WebGLRenderer( { antialias: true });
    this.renderer.localClippingEnabled = true;

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

    /*
    this.printBed = new THREE.Mesh(
      new THREE.BoxGeometry(100, 100, 1, 8, 8, 2),
      new THREE.MeshLambertMaterial( {color: 0xbebebe, side: THREE.DoubleSide, transparent: true, opacity: 0.5})
    );
    this.printBed.position.set(50, 50, 0);
    this.scene.add(this.printBed);
    */

    this.controls = new THREE.TrackballControls(this.camera, this.container);
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.25; // only applicable if staticMoving is false
    this.controls.rotateSpeed = 3.0;
    this.controls.zoomSpeed = 2.0;
    this.controls.panSpeed = 0.4;

    this.groups = [];

    this._init = true;

    this.update();
  }

  _throwIfNotInitialized() {
    if (!this._init) {
      throw 'Canvas must be initialized'
    }
  }

  /**
   * Resets the Canvas and removes all ModelGroup objects.
   * Note, the Canvas remains initialized and Canvas.init does
   * not need to be called after a reset.
   */
  reset() {
    this._throwIfNotInitialized();

    let scene = this.scene;
    this.groups.forEach(
      function(g) {
        scene.remove(g.group);
        g.reset();
      }
    );
    this.groups = [];
  }

  /**
   * Needs to be called in render loop
   */
  update() {
    this._throwIfNotInitialized();

    this.headlamp.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }

  /**
   * 
   * @param {string} name 
   * @param {UI.Model} model 
   * @param {UI.Results} [results]
   * @returns {Promise<UI.ModelGroup>}
   */
  newModelGroup(name, model, results=undefined) {
    this._throwIfNotInitialized();

    return new Promise(
      (resolve, reject) => {
        let g = new ModelGroup(name, model, results);
        
        this.groups.push(g);
        this.scene.add(g.group);

        this.resize(g.surface.geometry);

        resolve(g);
      }
    )
  }

  // TODO - how to handle sizing with multiple ModelGroups?
  resize(geom) {
    this._throwIfNotInitialized();

    this.sizer = new Sizer(geom);

    this.camera.near = this.sizer.camera.near;
    this.camera.far = this.sizer.camera.far;

    this.setView(this.views.Isometric);

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

  /**
   * Centers the contents of the canvas within view
   */
  center() {
    this._throwIfNotInitialized();

    this.controls.target.copy(
      this.sizer.center
    );
  }
  
  /**
   * Re-positions the camera to center and fit the contents of the canvas within view
   * @param {number} [zoomOutFactor=1.1] The factor to zoom out. Larger numbers will zoom out further.
   */
  zoomToFit(zoomOutFactor=1.1) {
    this.center();

    // vdist is the distance vector from the current camera position to the center
    let vdist = this.sizer.center.clone();
    vdist.negate();
    vdist.add(this.camera.position);

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

  /**
   * Set the camera view directly from vectors. Zooms to fit after the
   * camera is re-positioned.
   * @param {THREE.Vector3} position Camera position
   * @param {THREE.Vector3} up Camera "up" axis
   */
  setViewFromVectors(position, up) {
    this._throwIfNotInitialized();

    this.camera.position.copy(position);
    this.camera.up.copy(up);
    this.zoomToFit();
  }

  /**
   * @typedef {Object} View
   * @property {THREE.Vector3} position
   * @property {THREE.Vector3} up
   */

  /**
   * Set the camera to a pre-determined view. See Canvas.views for
   * a set of default views.
   * @param {View} view
   */
  setView(view) {
    this.setViewFromVectors(view.position, view.up);
  }

  /**
   * @typedef {Object} PresetViews
   * @property {View} Top Sets the XY plane in the plane of the canvas, positions the camera such that is looking in the negative Z direction
   * @property {View} Bottom Sets the XY plane in the plane of the canvas, positions the camera such that is looking in the positive Z direction
   * @property {View} Front Sets the XZ plane in the plane of the canvas, positions the camera such that is looking in the negative Y direction
   * @property {View} Back Sets the XZ plane in the plane of the canvas, positions the camera such that is looking in the positive Y direction
   * @property {View} Right Sets the YZ plane in the plane of the canvas, positions the camera such that is looking in the negative X direction
   * @property {View} Left Sets the YZ plane in the plane of the canvas, positions the camera such that is looking in the positive X direction
   * @property {View} Isometric Isometric view
   */

  /**
   * Preset views. Note these are based off the size of the loaded
   * models. Do not store these views, always access them at the time of calling
   * setView.
   * @type {PresetViews}
   */
  get views() {
    this._throwIfNotInitialized();

    let s = this.sizer;
    return {
      Top: {
        position: new THREE.Vector3(s.center.x, s.center.y, s.dim.z),
        up: new THREE.Vector3(0, 1, 0)
      },

      Bottom: {
        position: new THREE.Vector3(s.center.x, s.center.y, -s.dim.z),
        up: new THREE.Vector3(0, 1, 0)
      },

      Front: {
        position: new THREE.Vector3(s.center.x, s.dim.y, s.center.z),
        up: new THREE.Vector3(0, 0, 1)
      },

      Back: {
        position: new THREE.Vector3(s.center.x, -s.dim.y, s.center.z),
        up: new THREE.Vector3(0, 0, 1)
      },

      Right: {
        position: new THREE.Vector3(s.dim.x, s.center.y, s.center.z),
        up: new THREE.Vector3(0, 0, 1)
      },

      Left: {
        position: new THREE.Vector3(-s.dim.x, s.center.y, s.center.z),
        up: new THREE.Vector3(0, 0, 1)
      },

      Isometric: {
        position: s.camera.position.clone(),
        up: new THREE.Vector3(0, 0, 1)
      }
    }
  }
};

module.exports = Canvas;