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

    this.controls = new THREE.TrackballControls(this.camera, this.container);
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.25; // only applicable if staticMoving is false
    this.controls.rotateSpeed = 3.0;
    this.controls.zoomSpeed = 2.0;
    this.controls.panSpeed = 0.4;

    this.meshes = new THREE.Group();
    this.surface = new THREE.Mesh();
    this.wireframe = new THREE.LineSegments();
    this.contour = new THREE.Mesh();

    this.surface.visible = false;
    this.wireframe.visible = false;
    this.contour.visible = false;

    this.meshes.add(this.surface, this.wireframe, this.contour);

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

    this.surface.geometry = this.model.meshGeometry(new THREE.Color(0x00fff0));
    this.surface.material = new THREE.MeshLambertMaterial({color: 0xacacac, side: THREE.FrontSide, wireframe: false});

    this.wireframe.geometry = this.model.wireframeGeometry();
    this.wireframe.material = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false});

    this.contour.geometry = this.model.meshGeometry(new THREE.Color(0x0000ff));
    this.contour.material = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, side: THREE.FrontSide});

    //this.meshes.add(mesh);

    this.surface.visible = true;
    this.wireframe.visible = true;

    this.resize(this.surface.geometry);
  }
  
  setResults(results) {
    this.results = new Results(results);
  }

  deform(stepName, scaleFactor=1.0) {
    for (let m of [this.surface, this.wireframe, this.contour]) {
      if (m.visible) {
        this.results.deform(this.model.mesh.nodes, m.geometry, stepName, scaleFactor);
      }
    }
    //this.resize(this.surface.geometry);
  }

  nodeContour(stepName, nodeResultName, component) {
    this.results.contour(this.contour.geometry, stepName, nodeResultName, component);

    this.surface.visible = false;
    this.contour.visible = true;
  }

  resize(box) {
    let sizer = new Sizer(box);

    this.camera.near = sizer.camera.near;
    this.camera.far = sizer.camera.far;
    this.camera.position.set(
        sizer.camera.position.x,
        sizer.camera.position.y,
        sizer.camera.position.z
    );

    this.camera.updateProjectionMatrix();

    this.controls.target.set(
        sizer.camera.lookAt.x,
        sizer.camera.lookAt.y,
        sizer.camera.lookAt.z,
    );

    this.headlamp.target = this.meshes;
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
  
};

module.exports = Canvas;