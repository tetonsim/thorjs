const THREE = require('three');
const TrackballControls = require('./TrackballControls');

class Canvas {
  constructor(element) {
    this.renderer = new THREE.WebGLRenderer( { antialias: true });

    let W = element.clientWidth;
    let H = element.clientHeight;

    this.renderer.setSize(W, H);

    element.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color(0xffffff);
    
    this.camera = new THREE.PerspectiveCamera(10, W / H, 1, 10000);
    this.ambient = new THREE.AmbientLight(0x808080);
    this.headlamp = new THREE.DirectionalLight(0xffffff, 0.5);
    this.standardMaterial = new THREE.MeshLambertMaterial({color: 0xacacac, side: THREE.FrontSide, wireframe: false});
    this.contourMaterial = new THREE.MeshLambertMaterial({vertexColors: THREE.VertexColors, side: THREE.FrontSide});
    this.wireframeMaterial = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1, lights: false});

    this.scene.add(this.camera);
    this.scene.add(this.ambient);
    this.scene.add(this.headlamp);

    this.controls = new THREE.TrackballControls(this.camera, element);
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.25; // only applicable if staticMoving is false
    this.controls.rotateSpeed = 6.0;
    this.controls.zoomSpeed = 4.0;
    this.controls.panSpeed = 0.4;

    this.update();
  }

  update() {
    this.headlamp.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
  }
};

module.exports = Canvas;